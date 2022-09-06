# [Changelog v1.0.1](https://github.com/digas99/schedule-ua/releases/tag/v1.0.1) 

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
- Page with the interface of the schedule.
- Possibility to navigate through the schedule by clicking in the classes and the week days.
- Highlight of the cell corresponding to the current hour of the day
- Detailed information on the classes of the day when viewing the schedule on a single day mode
- Expand or trim the schedule size, based on the the first and last hours of classes of the day
- Download schedule configuration file
- Take a picture and download the schedule
- Customize your experience on the Settings page