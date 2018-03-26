---
title: Insomni'Hack 2018 - vba01-baby
---

# {{page.title}}
Solves: 56 / Points: 63
## Challenge resolution
The challenge's description references an infection linked to an .xls file. There are various ways of getting Excel to execute arbitrary code, macros being the most widely used vector. [Philippe Lagadec](https://decalage.info/en/taxonomy/term/12) and [Didier Stevens](https://blog.didierstevens.com/my-software/) published a ton of useful tools to analyze malicious documents. We start with `oledump`:
```shell
oledump.py -V vba01-baby_272038055eaa62ffe9042d38aff7b5bae1faa518.xls
[...]
  7: M    7020 '_VBA_PROJECT_CUR/VBA/Module1'
  8: m     985 '_VBA_PROJECT_CUR/VBA/Sheet1'
  9: m     993 '_VBA_PROJECT_CUR/VBA/ThisWorkbook'
[...]
```

`M` marks items that include macros that are set to auto-execute when the document opens so we dump the contents of that particular stream:
`oledump.py -V -v -s 7 vba01-baby_272038055eaa62ffe9042d38aff7b5bae1faa518.xls`

```vb
Attribute VB_Name = "Module1"
Sub Auto_Open()
    a ("Sheet1")
End Sub
Sub Workbook_Open()
    a ("Sheet1")
End Sub

Private Function a(ByVal aaaaaaaa As String) As String
    Dim aa As Integer
    Dim aaaa As String
    Dim aaaaaa As Worksheet
    Dim aaaaaaa() As String
    
    On Error GoTo e
    Set aaaaaa = Worksheets(aaaaaaaa)
    aa = 874104 / 220128
    aaa = 1
    strHex = ""
    Do While aaaaaa.Columns(aaa).Cells(aa, Int(221892 / 139112)).Value <> ""
        Do While aaaaaa.Columns(aaa).Cells(aa, Int(291792 / 189112)).Value <> ""
            aaaa = aaaa + Chr(aaaaaa.Columns(aaa).Cells(aa, 1).Value Xor ((37 Xor 12) + 1))
            aaa = aaa + Int(218526 / 213912)
        Loop
        aa = aa + Int(18526 / 13912)
        aaa = Int(199526 / 139112)
    Loop
    aaaaaaa = Split(aaaa, Chr(54 Xor 12))
    Set aaaaa = CreateObject(aaaaaaa(0))
    aaaaa.RegWrite aaaaaaa(1), aaaaaaa(2), "REG_SZ"
    Exit Function
e:
    Exit Function
End Function
```

We skip the obfuscated part and jump straight to the end of the function to see that it creates a registry entry. So we spin a Windows VM up, start [Procmon](https://docs.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite) and tune it so it monitors Registry events related to 'EXCEL.EXE' that contain 'INS'. Then we open the file and allow macros to run, quickly revealing the flag: `INS{Do_n0t_Ena8le_M4cro}`

Author: {% avatar Rakanga size=30 %} [@ZeArioch](https://twitter.com/ZeArioch)
