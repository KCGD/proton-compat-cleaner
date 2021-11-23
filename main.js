'use strict';
/**
 * 
 * This is a tool to clean up proton's compat dirs (mostly for non-steam games)
 * 
 * steam doesnt automatically delete these direcotries when you remove the game, and each one
 * can take up hundreds of MBs
 * 
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const rimraf = require('rimraf');
const readline = require('readline');


//create readline client
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});


//console mods
console["error"] = (message) => {
    console.log(`[${chalk.red("ERROR")}]: ${message}`);
}
console["warn"] = (message) => {
    console.log(`[${chalk.yellow("WARN")}]: ${message}`);
}
console["info"] = (message) => {
    console.log(`[${chalk.green("INFO")}]: ${message}`);
}

var conf;

//init
if(!fs.existsSync(path.join(process.cwd(), "./conf.json"))){

    //guess proton compat dir, if incorrect, user supplies the dir in the else statement
    let guessCompatDir = path.join(os.homedir(), ".steam/debian-installation/steamapps/compatdata");
    rl.question(`Look for proton compats in "${guessCompatDir}"? if not, please provide the directory manually [y/n]: `, (ans) => {
        if(ans.toLowerCase() === "y"){
            console.log("Using dir:", guessCompatDir);

            conf = {
                "dir":guessCompatDir
            }
    
            fs.writeFileSync(path.join(process.cwd(), "./conf.json"), JSON.stringify(conf));
            Main();

        } else {
            //guess was incorrect, user provides the compat dir
            rl.question("Please provide the directory to scan for prooton compats: ", (a) => {
                console.log("Using dir:", a);
        
                conf = {
                    "dir":a
                }
        
                fs.writeFileSync(path.join(process.cwd(), "./conf.json"), JSON.stringify(conf));
                Main();
            })
        }
    })
} else {
    //config already exists, just load it and call Main
    conf = JSON.parse(fs.readFileSync(path.join(process.cwd(), "./conf.json")).toString());
    Main();
}


function Main(){
    //check if compat dir exists (may not if the program guessed wrong)
    if(fs.existsSync(conf.dir)){

        //list compats
        let compatList = fs.readdirSync(conf.dir);
        console.info("Found compat dirs:");

        compatList.forEach(f => {
            console.log(`\t${f}`);
        })

        console.log("");
        rl.question("Scan for game names? [Y/n]: ", (a) => {

            let foundConfs = [];
            let notFoundConfs = [];

            if(a.toLowerCase() === "y"){

                //for each compat, search AppData folder (Local and LocalLow) for folder names that ARE NOT in the blacklist, will usually return the name of the game
                //or manufacturer. It stores all thats found in possibleNames, which is exported into foundConfs. If it cant find any names, the conf goes to notFoundConfs
                compatList.forEach((compat) => {

                    let possibleNames = [];

                    let appDataPath = path.join(conf.dir, `./${compat}/pfx/drive_c/users/steamuser/AppData/`)

                    //make sure the compat has an appdata dir. you never know ¯\_(ツ)_/¯
                    if(fs.existsSync(appDataPath)){

                        let local = [];
                        let localLow = [];

                        //Either appdata dir may or may not exist, cant put them in the same try cause one will take out the other if it doesnt exist.
                        try{
                            local = fs.readdirSync(path.join(appDataPath, "Local"));
                        } catch (e){};

                        try{
                            localLow = fs.readdirSync(path.join(appDataPath, "LocalLow"));
                        } catch (e){};

                        //most compats will have these. They are excluded to not clutter the possible names
                        let blacklist = ["Microsoft", "openvr", "UnrealEngine"];

                        //combine Local and LocalLow found names to make processing easier
                        (local.concat(localLow)).forEach((name) => {
                            if(!blacklist.includes(name)){

                                possibleNames.push(name);

                                //try Local
                                try{
                                    possibleNames.push(fs.readdirSync(
                                        path.join(conf.dir, `./${compat}/pfx/drive_c/users/steamuser/AppData/Local/${name}`)
                                    )[0]);
                                } catch(e){}

                                //try LocalLow
                                try{
                                    possibleNames.push(fs.readdirSync(
                                        path.join(conf.dir, `./${compat}/pfx/drive_c/users/steamuser/AppData/LocalLow/${name}`)
                                    )[0]);
                                } catch(e){}

                                foundConfs.push({
                                    "compat" : compat,
                                    "names" : possibleNames
                                })

                            }
                        })

                    } else {
                        notFoundConfs.push(compat);
                    }
                })

                //compat searches done, log what was found and not found
                console.info("Found names for these compats;");
                foundConfs.forEach(compat => {
                    console.log(`\t${compat.compat} - possible names: \n\t\t${compat.names.join("\n\t\t")}\n`);
                })

                console.log("");
                console.error("Couldnt find names for these compats");
                notFoundConfs.forEach(compat => {
                    console.log(`\t${compat}`);
                })

                //once operations done, go to terminal for deleting, etc
                questions(true);

            } else {
                questions(true);
            }
        })

    } else {
        //occurs when the compat dir doesnt exist. This could be due to the program incorrectly guessing or the user making a typo. Either edit 'conf.json' or delete it for a new prompt.
        console.error("Compat dir not found");
    }
}

//a cli interface for some commands
function questions(initial){
    if(initial){
        console.log("");
        console.info("Nothing else to do! Please enter a command (see help if unsure) or exit");
    }

    rl.question("> ", (a) => {
        switch (a.split(" ")[0]){
            case "help":
                console.log("\thelp - shows this menu");
                console.log("\tdelete (compat number) - deletes a proton compat (USE WITH CAUTION)!!!");
                console.log("\texit - exits the program");
                questions();
            break;

            //deletes a compat dir (IT DISPLAYS THE DIRECTORY WHILE CONFIRMING IF YOU WISH TO DELETE, MAKE SURE THE DIRECTORY IS CORRECT OR THERE CAN BE LOSS OF DATA)
            case "delete":
                if(a.split(" ")[1]){
                    let compatID = a.split(" ")[1];

                    if(fs.existsSync(path.join(conf.dir, compatID))){

                        rl.question(chalk.yellow(`Delete "${path.join(conf.dir, compatID)}"? THIS CANNOT BE UNDONE [y/n]: `), (ans) => {

                            if(ans.toLowerCase() === "y"){
                                rimraf(path.join(conf.dir, compatID), (e) => {
                                    if(e){
                                        throw e;
                                    } else {
                                        console.info("Deleted successfully");
                                        questions();
                                    }
                                })
                            } else {
                                console.info("Ok, not deleting");
                                questions();
                            }
    
                        })

                    } else {
                        console.error(`Could not find a compat with the id "${compatID}", wrong ID?`);
                        questions();
                    }
                } else {
                    console.error("Please provide a compat to delete!");
                    questions();
                }
            break;

            case "exit":
                process.exit(0);
            break;

            default:
                console.error(`Unknown command "${a}"`);
                questions();
        }
    })
    
}