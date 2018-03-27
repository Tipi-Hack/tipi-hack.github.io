# Write-ups
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a> (<span>{{ post.date | date: "%F" }}</span>)
    </li>
  {% endfor %}
</ul>

# About us
We are a French team of pentesters who like to play CTFs.

Participants vary for each CTF. Here is a list of current and past members.
{% for m in site.data.members %}
* {% include member.html member=m %}
{% endfor %}

Of course we are on [CTFtime](https://ctftime.org/team/24535).
# Twitter preview
<a class="twitter-timeline" data-width="500" data-height="500" data-theme="light" href="https://twitter.com/tipi_hack?ref_src=twsrc%5Etfw">Tweets by tipi_hack</a> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> 
