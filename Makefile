all: clean build

build:
	cd ./src; zip -r ../ArchiveDummyAlexa.zip .
	clear
	@echo "** Build Complete **"
setup:
	sudo npm install --prefix ./src restler

clean:
	@echo "** Running Cleanup **"
	rm -rf ArchiveDummyAlexa.zip
