S3_BUCKET ?= badgestudio.chicagosummeroflearning.org

download_assets: subtlepatterns/README.txt nounproject/README.txt

subtlepatterns/README.txt:
	curl http://subtlepatterns.toolness.org/subtlepatterns.tgz | tar -zxv

nounproject/README.txt:
	curl http://nounproject.toolness.org/nounproject.tgz | tar -zxv

optimize:
	node_modules/.bin/r.js -o mainConfigFile=js/require-config.js \
	  baseUrl=js paths.requireLib=../vendor/require \
	  include=requireLib,filepicker.io name=studio out=js/studio.min.js
	node_modules/.bin/r.js -o cssIn=css/studio.css out=css/studio.min.css

sync: download_assets optimize
	s3cmd sync --acl-public --guess-mime-type --exclude .git/ \
	--exclude node-modules -r ./ s3://${S3_BUCKET}/
