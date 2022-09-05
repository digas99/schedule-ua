# schedule-ua

<img width="275px" src="/images/logo-text.png">

## SchedUA - Schedule for Universidade de Aveiro

Browser Extension for easy access to your Schedule from Universidade de Aveiro. This extension uses the [PACO-UA API](https://github.com/digas99/paco-ua-api) to fetch the data from the schedule and present it in the Extension Popup.

<img alt="logo" align="left" src="/images/logo_48x48.png">
<a href="#"><img alt="chrome-webstore" width="170px" src="/images/chrome-webstore-logo.png"></a>

###### Idea for this project: [jtsimoes](https://github.com/jtsimoes)

### Table of Contents

1. [Latest Features](#latest-features)
1. [Usage Guide](#usage-guide)
    1. [Load Schedule](#load-schedule)
    1. [Schedule Page](#schedule-page)
    1. [Settings](#settings)
1. [Pictures](#pictures)

## Usage Guide

This is a simple browser extension that takes a json containing information on a schedule and shows it using HTML Tables. Because it is a browser extension, you can check your schedule anytime, anywhere while browsing the web.

### Load Schedule

The schedule can be loaded in many different ways, using the the first page of the extension. Some of the ways are as follows:

- **PACO API:** This extension uses an unofficial API that fetches data directly from [https://paco.ua.pt/secvirtual](https://paco.ua.pt/secvirtual). One of the endpoints is the student's schedule. For this to work, the institutional email and password need to be provided, hence the "login" page at the beginning [[3]](#3---different-ways-to-load-the-schedule). This will fetch the schedule configuration into the extension.

- **Upload directly from PACO:** While using the extension, two buttons are added to the schedule interface [[2]](#2---possibility-to-either-download-the-schedule-configuration-or-upload-it-directily-to-the-extension) at [https://paco.ua.pt/secvirtual/horarios/c_horario_aluno.asp](https://paco.ua.pt/secvirtual/horarios/c_horario_aluno.asp). If you click the Upload ⭱ button, the schedule configuration will be added to the extension.

- **Drag and drop configuration file:** If you have a configuration JSON file of the schedule, you can simply drag and drop it in the "login" page at the beginning [[3]](#3---different-ways-to-load-the-schedule). A configuration file can be obtained either within the extension, on an already setup schedule, through the Download ⭳ button in the side bar [[1]](#1---some-pages-within-the-extension-popup), or through the same button within the schedule interface in [https://paco.ua.pt/secvirtual](https://paco.ua.pt/secvirtual/horarios/c_horario_aluno.asp) [[2]](#2---possibility-to-either-download-the-schedule-configuration-or-upload-it-directily-to-the-extension).

- **Through the Browser Console:** A less convenient way would be to use the Browser Console and, using JavaScript, update the storage manually. To achieve this, do the following:
    - Right click anywhere **within** the Extension and select **Inspect**
    - When the **DevTools** window opens, click **Console** in the top navbar
    - Write the code of [[example code]](#example-code)
    - Press Enter. If the ouput is something like ```Promise {<pending>}```, then it worked

#### Example code
```javascript
// pass the JSON schedule configuration to the function set()
chrome.storage.sync.set({
    "schedule": {
        "Segunda": [
            {
            ...
            },
            {
            ...
            },
            ...
        ],
        "Terça": [
            {
            ...
            },
            ...
        ],
        ...
    },
    "school_year": "2021/2022",
    "semester": 1
})
```
To know more about the format of the Schedule Configuration JSON, go to [https://github.com/digas99/paco-ua-api/blob/main/docs/README.md#hor%C3%A1rio](https://github.com/digas99/paco-ua-api/blob/main/docs/README.md#hor%C3%A1rio).

### Schedule Page

When a schedule is successfully loaded into the extension, it is displayed in a different page, on a table [[1]](#1---some-pages-within-the-extension-popup). Here, you can choose between a view of the entire **Week**, or simply the classes for **Today**, the day before (**Yesterday**) and the day after (**Tomorrow**). The view you choose will show up the next time you open the extension.

Clicking on the days of the week in the Week view will also show the classes for that one day specifically.

Every view of a single day will show a lateral info container with details on the classes for that day.

The lateral navbar has three buttons with actions on the schedule:
- **Expand/Trim:** adapt the number of hours shown in the schedule, where trimming removes the hours not used for classes (holes in the schedule won't be removed)
- **Download Schedule Configuration:** download JSON file with the configuration of the schedule
- **Print Schedule:** take a picture of the schedule and download it

### Settings

There is a page that provides ways of customizing your experience with the app. The settings are the following:
- **Schedule**
    - **Schedule on Startup:** choose which type of schedule should show when opening the extension.
    - **Subject Colors:** customize the colors of each subject.
    - **Highlight Cell of Now:** Highlight the cell in the schedule that corresponds to the current time.
    - **Limit Schedule Trim:** limit min and max hours of the trim. This values are taken from the schedule itself.
- **Account**
    - **Remember Email:** remember email the next time you logout.
- **PACO**
    - **Download and Upload buttons:** extra buttons above the schedule in the schedule page in PACO - Secretaria Virtual.

## Pictures

##### 1 - Some pages within the extension popup.
<img alt="picture1" align="left" height="310px" src="/images/picture1.jpg">
<img alt="picture2" height="310px" src="/images/picture2.jpg">

##### 2 - Possibility to either download the schedule configuration, or upload it directily to the extension.
![picture3](/images/picture3.jpg)

##### 3 - Different ways to load the schedule.
![picture4](/images/picture4.jpg)