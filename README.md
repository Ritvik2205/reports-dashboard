# Dynamic Report Generator

Full stack web application to customise and view reports and other data

### Technologies used
Flask, HTML/CSS, Javascript (Jquery), MySQL, MongoDB

### Description
#### Step 1
The website allows you to connect to a MySQL database and load all tables in it. You can choose any amount of tables to display and whichever columns you wanna view.
If you select more than 1 table you will have to define their foreign key relation which should already be defined in your schema. 
Enter the report name and you move on to the next step.

#### Step 2
Here you can select
- which columns you wanna have a sorting feature on
- which 1 column you wanna specify a date period for
- which 1 column you wanna have search functionality for

And you click generate button to preview your report
#### Preview report
- Here you can search in the column you selected earlier
- There's another button for filters which gives you 4 options for each column
  - Equals
  - Does not equal
  - Includes
  - Does not include
- You can bunch filter up choosing from
  - AND
  - OR

#### Export
- You have the option to export the report in
  - CSV
  - Excel (xls)
