S3_BUCKET ?= badgestudio.chicagosummeroflearning.org

download_assets: subtlepatterns/README.txt nounproject/README.txt

subtlepatterns/README.txt:
	curl http://subtlepatterns.toolness.org/subtlepatterns.tgz | tar -zxv

nounproject/README.txt:
	curl http://nounproject.toolness.org/nounproject.tgz | tar -zxv

optimize:
	npm start

sync: download_assets optimize
	s3cmd sync --acl-public --guess-mime-type --exclude .git/ \
	--exclude node-modules -r ./ s3://${S3_BUCKET}/
