# proton-compat-cleaner

proton compat cleaner is a command line tool used to clean up unused steam proton compat directories. When you get rid of a game on steam (official or non steam game), it's proton compat path is not deleted, and these can take upwards of 200mb each. This tool helps identify these directories and lets you remove unwanted ones.

# Building
### Installing node
First, nodejs and npm must be accessible from the command line.

Ubuntu/Debian
```bash
sudo apt install nodejs npm
```

Arch
```bash
sudo pacman -S nodejs npm
```


### Downloading and compiling the code
Clone the repository

```bash
git clone https://github.com/KCGD/proton-compat-cleaner.git
cd proton-compat-cleaner
```

Once in the repository folder, install the necessary packages
```bash
npm i
```

Lastly, compile the code
```bash
./build.sh
```

This will make an executable in the `/dist` directory.

## License
[MIT](https://choosealicense.com/licenses/mit/)
