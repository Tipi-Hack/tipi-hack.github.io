---
title: Welcome
---

# Write-ups
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>

# CTF tools
Go check the tools we developed for CTF events in our [*'ctf-tool'* Github repo](https://github.com/Tipi-Hack/ctf-tools/).

# About us
We are a French team of friends who like to play CTFs. We are not affiliated with our employers, nor any other company.

Participants vary for each CTF event. Here is a compilation of all our current and past members.
{% for m in site.data.members %}
* {% include member.html member=m %}
{% endfor %}

And, we are on [CTFtime](https://ctftime.org/team/24535) of course.
# Twitter preview
<a class="twitter-timeline" data-width="500" data-height="500" data-theme="light" href="https://twitter.com/tipi_hack?ref_src=twsrc%5Etfw">Tweets by tipi_hack</a> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> 
