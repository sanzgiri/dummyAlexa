all: clean build

build:
	cd ./src; zip -r ../ArchiveDummy.zip .
	clear
	@echo "** Build Complete **"
setup:
	sudo npm install --prefix ./src restler

clean:
	@echo "** Running Cleanup **"
	rm -rf ArchiveDummy.zip
