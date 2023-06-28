# [Changelog v1.3.0](https://github.com/digas99/schedule-ua/releases/tag/v1.3.0)

## Popup
- The abbreviation for the Current/Next class of the day now shows up on the extension icon
- Added possibility to highlight mouse target cell on the schedule (can be enabled on settings)
- Added subject code to paco schedule scraper and to the extension itself
- Added mechanism to load each subject schedule with all possible classes (with message logging the progress to the user)
- Right click on a class cell opens context menu with the following options:
    - Complete Schedule: show all classes for that subject
    - Edit Class: edit class information
    - Remove Class: remove that class from the schedule
    - Remove Subject: remove all classes from that subject from the schedule
- Clicking on an empty cell in the schedule allows to add a new class

---

# [Changelog v1.2.1](https://github.com/digas99/schedule-ua/releases/tag/v1.2.1) 
Released on 11/09/2022

## Bug Fixes
- Fixed bug of Changelog not loading in about page
- Changing pages within the extension while using a color theme doesn't flicker white anymore
- Fixed issue where choosing a subject color with the color picker on settings would break if many colors were clicked within the color picker (now, the color is only saved when the color picker is closed)
- Clicking on a class from a subject that has only one day on the schedule now shows the info panel on the right, instead of showing just one full sized schedule with one single day

## Popup
- Added button to lateral navbar to list all the subjects from the current schedule
- Color Themes:
    - Sapphire
    - Ambar

# [Changelog v1.2.0](https://github.com/digas99/schedule-ua/releases/tag/v1.2.0) 
Released on 10/09/2022

***Dark Mode!***

## Popup
- Added Dark Mode
- Added Changelog to about page
- Color Themes:
    - Light Mode
    - Light High Contrast
    - Dark Mode
    - Dark High Contrast

---

# [Changelog v1.1.0](https://github.com/digas99/schedule-ua/releases/tag/v1.1.0) 
Released on 08/09/2022

***Overlapping classes!***

## Popup
- Added compatibility with overlapping classes
- Possibility to expand a day with overlapping classes with a Right Click on the day (can handle one overlap for now)
- Clicking the File Drop container in the login page now opens the file explorer to select a configuration file

## Content
- Updated schedule parser to be able to fetch schedules from single subjects

---

# [Changelog v1.0.1](https://github.com/digas99/schedule-ua/releases/tag/v1.0.1) 
Released on 07/09/2022

## Bug Fixes
- Fixed issue with classes starting at the half hour (--h30)
- Fixed class info popup not showing when hovering classes the first time the schedule was loaded
- Added another layer of error warnings when fetching the schedule through the PACO API, to prevent infinite loading screen

## Popup
- Changed days selector from the bottom of the page to a popup on the navbar that opens when hovering over the schedule button

# [Changelog v1.0.0](https://github.com/digas99/schedule-ua/releases/tag/v1.0.0) 
Released on 06/09/2022

## Content
- Download and Upload buttons in the interface of the student's schedule at [https://paco.ua.pt/secvirtual/horarios/c_horario_aluno.asp](https://paco.ua.pt/secvirtual/horarios/c_horario_aluno.asp) to easily upload/download the schedule configuration

## Popup
- "Login" page to load the schedule configuration, either through the PACO API or by droping the configuration file directly
- Page with the interface of the schedule
- Possibility to navigate through the schedule by clicking in the classes and the week days.
- Highlight of the cell corresponding to the current hour of the day
- Detailed information on the classes of the day when viewing the schedule on a single day mode
- Expand or trim the schedule size, based on the the first and last hours of classes of the day
- Download schedule configuration file
- Take a picture and download the schedule
- Customize your experience on the Settings page