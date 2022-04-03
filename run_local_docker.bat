REM explorer "http://127.0.0.1:4000/"
docker run --rm -p 4000:4000 --volume="%CD%:/srv/jekyll" jekyll/jekyll sh -c "bundle install && bundle exec jekyll serve --drafts