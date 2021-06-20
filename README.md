# Alien Logger 👽⌨️

![banner3](https://user-images.githubusercontent.com/29873078/113494887-6e199200-94f5-11eb-9bb2-581c40e23b0f.jpg)

Alien Logger is a MaaS (Malware as a Service) website offering an easier to use alternative from the traditional keylogger.
You create an account from where you can recieve a secret key, then you can download the client payload on the device you want to monitor and use the key to validate it. Then you can view all the collected data on your panel.

This project was developed by me a while ago as a PoC hosted at 👽⌨️.ws and im releasing it as i decided don't wanna work on it anymore, i hope you find the code interesting and that you'll learn something from it :)

# Features

-   No need to buy domain or server
-   No need to port-forward
-   No need to setup SMTP on your email
-   No need for manual file recovery
-   Strong data encryption
-   Client auto startup

# Self-hosted installation

Alien Logger is built to be pretty reliable with a score of 98% uptime for the year it was deployed.
You don't need to install a reverse-proxy as SSL certificates are handled by the app itself.

It's only been tested on Debian distros and this guide will assume that you're using one.

1.  Clone this repo and navigate in it
2.  Install MySQL or MariaDB and make sure it's running
3.  Copy the contents of `table.sql`
4.  Open your database manager and create a database
5.  Select the database and run the copied contents as SQL, this will create the accounts table
6.  Edit the contents of `config.json` with your info
7.  Edit `sitemap.xml` `robots.txt` and `views/seo.pug` with your info
8.  Install dependencies `npm install`
9.  If you want SSL place `server.cert` and `server.key` in `certs/`
10. Navigate to `/client` and compile `payload.py` with PyInstaller `pyinstaller payload.py --noconsole --onefile`
11. After it compiles rename the file in `dist/` to `alienLogger.exe` and move it to the `dl-content/` folder
12. If you want monetization place your miner script in `views/miner.pug`
13. Run the app with `node .` or use a process manager (PM2)

There is daily database backup implemented.
There is IP blacklist.
There is code for cloudfare support.
All actions are logged at `logs.txt`.
ReCAPTCHA credidentials required.

# Usage

## Step 1

Go to **/home** and download the payload executable by clicking **Download Payload**.

Chrome may flag it as a virus and refuse to download it, in that case go to chrome's downloads and click on **Keep dangerous file**.
![image](https://user-images.githubusercontent.com/29873078/113494778-4d9d0800-94f4-11eb-94d6-30745531c2e9.png)

## Step 2

On **/home** click **View Secret Key** and copy your key from the prompt, you will need it later.
![image](https://user-images.githubusercontent.com/29873078/113494782-542b7f80-94f4-11eb-85dd-0b13db866ea2.png)

## Step 3

On the victims machine run the executable and insert your key to start the logger.

You can transfer the **.exe** with a usb drive allongside a **.txt** containing your key.
![image](https://user-images.githubusercontent.com/29873078/113494785-57bf0680-94f4-11eb-9512-bb358dd82c8d.png)

## Step 4

View all the logs collected from that machine by clicking **Show Logs**.
![image](https://user-images.githubusercontent.com/29873078/113494787-5b528d80-94f4-11eb-90af-5170fa9b8ff2.png)

**I will not be responsible for any direct or indirect damage caused due to the usage of this tool, it is for educational purposes only.**
