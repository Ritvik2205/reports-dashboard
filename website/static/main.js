
$(document).ready(function() {
    $(".lead-status-select").change(applyFilters)

    // --------------------------------------------------------------------------------------------------------
    // ----------------------------------------------- Homepage -----------------------------------------------
    // --------------------------------------------------------------------------------------------------------

    $('.load-report').on('click', function(e) {
        e.preventDefault();

        var reportId = $(this).data('report-id');
        $.ajax({
            url: `/get-report`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                reportId : reportId,
            }),
            dataType: 'json',
            success: function(reportJSON) {                
                localStorage.setItem('reportData', reportJSON);
                window.location.href = '/dashboard';
            }
        });   
    });


    // --------------------------------------------------------------------------------------------------------
    // ---------------------------------------------- Dashboard -----------------------------------------------
    // --------------------------------------------------------------------------------------------------------
    
    var storedReport = localStorage.getItem('reportData');
    if (storedReport) {
        console.log('exists');
        var report = JSON.parse(storedReport);

        var reportName = report.report_name;
        var tableNames = report.active_table_names;
        var listItems = report.active_list_items;
        var sortingColumns = report.columns_for_sorting;
        var activeSearchColumn = report.active_search_column;
        var activeDatetimeColumn = report.active_datetime_column;
        var reportStartDate = report.report_start_date;
        var reportEndDate = report.report_end_date;
        const startDate = moment(reportStartDate, 'DD-MM-YYYY');
        const endDate = moment(reportEndDate, 'DD-MM-YYYY');

        setTimeout(function() {
            $('.report-name-title').text(reportName);
            $('#tab1 .report-name-input').val(reportName);
            var $activeTableNames = $('#tab1 .card.active').map(function() {
                return $(this).attr('table-name'); 
            }).get();
            for (var i in tableNames) {  
                console.log(tableNames[i]);     
                $(`.card.${tableNames[i]}`).click();
            }
            setTimeout(function() {
                for (var i in listItems) {
                    $(`#tab1 .list .list-item.${listItems[i]}`).click();
                }
                setTimeout(function() {
                    for (var i in sortingColumns) {
                        $(`#tab2 .middle-panel .list .list-item.${sortingColumns[i]}`).click();
                    }
                    setTimeout(function() {
                        $(`#tab2 .right-panel .list .list-item.${activeSearchColumn}`).click();
                        $(`#tab2 .initial-section .list .list-item.${activeDatetimeColumn}`).click();
                        cb(startDate, endDate);
                    }, 600);
                }, 300);
            }, 50);
        },5);
        
        
        

        // $('#reportrange span').html(report.reportStartDate + ' - ' + report.reportEndDate);

        localStorage.removeItem('reportData');
    }

    // Tabs logic
    $(".tablink").click(function() {
        $(".tablink").removeClass("active");
        $(".tabcontent").removeClass("active").hide();

        $(this).addClass("active");

        var $tab = $(this).data("tab-value");

        $($tab).addClass("active").show();

    })
    

    // Navigation button - next
    $(".next").click(function() {
        var $currentActiveTab = $(".tablink.active");
        var $nextTab = $currentActiveTab.next(".tablink");
        if ($nextTab.length) {
            $currentActiveTab.removeClass("active");
            $nextTab.addClass("active");

            var $tab = $nextTab.data("tab-value");
            $(".tabcontent").removeClass("active").hide();
            $($tab).addClass("active").show();
        }
    })

    // Navigation button - previous
    $(".prev").click(function() {
        var $currentActiveTab = $(".tablink.active");
        var $prevTab = $currentActiveTab.prev(".tablink");
        if ($prevTab.length) {
            $currentActiveTab.removeClass("active");
            $prevTab.addClass("active");

            var $tab = $prevTab.data("tab-value");
            $(".tabcontent").removeClass("active").hide();
            $($tab).addClass("active").show();
        }
    })

    // Report Name entered
    $('.report-name-input').on('input', function() {
        var reportName = $('#tab1 .report-name-input').val();
        if (reportName != "") {
            $(".report-name-title").text(reportName);
        } else {
            $(".report-name-title").text("New Report");
        }
    });
        
    // Table card search
    $('#tab1 .table-search-input').on('keyup', function() {
        var nameValue = $(this).val().toUpperCase();
        $('.card').each(function() {        
            var tableName = $(this).text().trim().toUpperCase();        
            var matchesName = (tableName.indexOf(nameValue) > -1 || nameValue === '');

            if (matchesName) {
                $(this).css('display', '').show();
            }
            else {
                $(this).css('display', 'none').hide();
            }
        });
    })

    // Date Range Picker
    var start = moment().subtract(29, 'days');
    var end = moment();

    function cb(start, end) {
        $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
    }

    $('#reportrange').daterangepicker({
        startDate: start,
        endDate: end,
        ranges: {
           'Today': [moment(), moment()],
           'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           'Last 7 Days': [moment().subtract(6, 'days'), moment()],
           'Last 30 Days': [moment().subtract(29, 'days'), moment()],
           'This Month': [moment().startOf('month'), moment().endOf('month')],
           'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        opens: 'right',
        drops: 'down'
    }, cb);

    cb(start, end);

    var activeTableColumns = {};

    // Clicking table names
    function onCardClick(card, activeTableColumns) {
        const tableName = card.attr('table-name');
        // $(".card").removeClass("active");
        if (card.hasClass('active')) {
            card.removeClass('active');
            card.find('.icon').css('transform', '');
            $(`#tab1 .middle-panel .list.${tableName} .list-item`).each(function() {              
                $(this).removeClass('active').remove();                   
            })
            $(`#tab1 .middle-panel .list.${tableName} .list-item`).hide();
            $(`#tab1 .middle-panel .table-container.${tableName}`).css('display', 'none').hide();
            delete activeTableColumns[tableName];
        } else {    
            card.addClass('active');
            $(`#tab1 .middle-panel .table-container.${tableName}`).css('display', '').show();

            $.ajax({
                url: `/get-columns/${tableName}`,
                type: 'GET',
                dataType: 'json',
                success: function(columns) {
                    const $list = $(`#tab1 .middle-panel .list.${tableName}`);
                    $list.empty(); 
                    $.each(columns, function(index, column) {
                        const $listItem = $('<div></div>', {
                            'class': `list-item selectable ${column}`,
                            'html': `${column}`
                        });

                        const $itemContainer = $('<div></div>', {
                            'class': 'item-container',
                            'html': '',
                            'css': {'float': 'left'}
                        });

                        const $checkBoxContainer = $('<div></div>', {
                            'class': 'checkbox-container',
                            'html': 
                            '<input type="checkbox" class="list-item-checkbox"><span class="checkbox-span"></span>',
                            'css': {
                                'float': 'left',
                                'display': 'none'
                            }
                        })

                        $itemContainer.append($checkBoxContainer);
                        $itemContainer.append($listItem);
                        $list.append($itemContainer); 
                    });
                }
            });
            activeTableColumns[tableName] = [];
        }

        // Card - icon moving functionality on each click
        var $icon = card.find('.icon');
        var $iconContainer = card;

        if ($iconContainer.hasClass('active')) {
            var containerWidth = $iconContainer.width();
            var iconWidth = $icon.width();
            var distanceToMove = containerWidth - iconWidth;
            $activeIcon = $('.card.active .icon')

            $activeIcon.css('transform', 'translateX(' + distanceToMove + 'px)');
        } else {

        };

        return activeTableColumns;
    }

    // Showing the name of the tables and its columns 
    $(".card").on('click', function() {
        activeTableColumns = onCardClick($(this), activeTableColumns);
    });

    // Foreign key button toggle view
    $('.foreign-key-btn').on('click', function() {
        $(this).toggleClass('active');
        if ($(this).hasClass('active')) {
            $('.checkbox-container').css('display', '');
        } else {
            $('.checkbox-container').css('display', 'none');
        }
    })

    let tableRelations = [];
    let selectedColumns = [];
    let selectedTables = [];

    $('#tab1 .middle-panel .list').on('click', '.checkbox-container input' ,function() {
        $(this).toggleClass('active');
        var columnName = $(this).closest('.item-container').find('.list-item').text().trim();
        var tableName = $(this).closest('.list').data('table-name');
        if ($(this).hasClass('active')) {            
            selectedColumns.push(columnName);
            selectedTables.push(tableName);
        } else {
            selectedColumns = selectedColumns.filter(col => col !== columnName);
            selectedTables = selectedTables.filter(table => table !== tableName);
        }   
        
        if (selectedColumns.length == 2) {
            addForeignKeyRelation(selectedTables[0], selectedTables[1], selectedColumns[0], selectedColumns[1]);
            displayForeignKeyRelation(selectedTables, selectedColumns);
            selectedColumns = [];
            selectedTables = [];
            $('#tab1 .checkbox-container input').prop('checked', false);            
            $('#tab1 .checkbox-container input').removeClass('active');                        
        }
    })

    function displayForeignKeyRelation(selectedTables, selectedColumns) {
        const relationHTML = $('<div></div>', {
            'class': `table-relation`,
            'html': ''
        });   
        
        const relationTables = $('<div></div>', {
            'class': `table-relation-tables`,
            'html': `${selectedTables[0]} - ${selectedTables[1]}`
        });

        const relationcolumns = $('<div></div>', {
            'class': `table-relation-columns`,
            'html': `${selectedColumns[0]} - ${selectedColumns[1]}`
        });
        relationHTML.append(relationTables);        
        relationHTML.append(relationcolumns);  

        $('#tab1 .right-panel .relations-list').append(relationHTML);
    }
        

    function addForeignKeyRelation(table1, table2, column1, column2) {
        const relation = {
            table1: table1,
            table2: table2,
            column1: column1,
            column2: column2
        }
        tableRelations.push(relation);
    }

    // Columns list selection toggle for tab1
    $("#tab1 .middle-panel .list").on('click', '.list-item', function() {
        $(this).toggleClass('active');
        var tableName = $(this).closest('.list').data('table-name');
        if (!activeTableColumns[tableName]) {
            activeTableColumns[tableName] = [];
        }
        var columnName = $(this).text().trim();
        if ($(this).hasClass('active')) {
            if (!activeTableColumns[tableName].includes(columnName)) {
                activeTableColumns[tableName].push(columnName);            
            }
        } else {
            activeTableColumns[tableName] = activeTableColumns[tableName].filter(column => column !== columnName);
        }
    });

    // Select All Button
    $('#selectAllColumns').click(function() {        
        activeTableColumns = {};

        $('#tab1 .card.active').each(function() {
            var tableName = $(this).attr('table-name');
            if (!activeTableColumns[tableName]) {
                activeTableColumns[tableName] = [];
            }

            $(`#tab1 .middle-panel .list.${tableName} .list-item`).each(function() {
                var columnName = $(this).text().trim();
                activeTableColumns[tableName].push(columnName);
                $(this).addClass('active');
            })
        })
        console.log(activeTableColumns);
    });

    // View Type Selection
    $('#tab1 .right-panel .view-item').click(function() {
        $(this).toggleClass('active');
    })

    // Extending all table list by default
    $("#tab1 .selected-tables .table-name").addClass('active');
    

    // -------------------------------------------------- Tab 2 --------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------

    function selectablesClick(activeTableColumns) {
        // Displaying selected columns in tab2
        var $activeTableNames = $('#tab1 .card.active').map(function() {
            return $(this).attr('table-name'); 
        }).get();
        

        // in middle-panel
        $('#tab2 .table-name').each(function() {
            var tableName = $(this).attr('table-name');
            if ($activeTableNames.includes(tableName)) {
                $(this).parent().css('display', '').show();

                var activeColumns = activeTableColumns[tableName];
                const $middleList = $(`#tab2 .middle-panel .list.${tableName}`);  
                const $rightList = $(`#tab2 .right-panel .list.${tableName}`);                          
                $middleList.empty();  
                $rightList.empty();
                activeColumns.forEach(column => {
                    const $middleListItem = $('<div></div>', {
                        'class': `list-item ${column}`,
                        'html': `${column}`
                    });
                    const $rightListItem = $('<div></div>', {
                        'class': `list-item ${column}`,
                        'html': `${column}`
                    });
                    $middleList.append($middleListItem);   
                    $rightList.append($rightListItem);
                })
            } else {
                $(this).parent().css('display', 'none').hide();
            }
        });

        var activeTableNames = $('#tab1 .card.active').map(function() {
            return $(this).text().trim(); 
        }).get();

        $('#tab1 .card').each(function() {
            var tableName = $(this).attr('table-name');
            const $dateList = $(`#tab2 .initial-section .list.${tableName}`);
            if (!activeTableNames.includes(tableName)) {
                $dateList.css('display', 'none').hide();
            } else {
                // $dateList.css('display', '').show();
            }
        })

        // displaying columns with Date or Datetime        
        if (activeTableNames.length != 0) {
            $.ajax({
                url: `/datetime-columns`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    activeTableColumns: activeTableColumns,
                    activeTableNames: activeTableNames
                }),
                dataType: 'json',
                success: function(columnsDict) {    
                    activeTableNames.forEach(activeTable => {
                        if (columnsDict[activeTable]) {
                            const $list = $(`#tab2 .initial-section .list.${activeTable}`);
                            $list.css('display', '').show();
                            $list.empty(); 
                            $.each(columnsDict[activeTable], function(index, column) {
                                const $listItem = $('<div></div>', {
                                    'class': `list-item ${column}`,
                                    'html': `${column}`
                                });
                                $list.append($listItem); 
                            });
                        }                        
                    })            
                }
            });
        }
    }

    $('#tab1 .selectable').click(function() {
        selectablesClick(activeTableColumns);
    });
    
    // Datetime list selection toggle 
    $("#tab2 .initial-section .list").on('click', '.list-item', function() {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            $('#tab2 .date-section').css('display', 'none').hide();
        } else {
            $("#tab2 .initial-section .list-item").removeClass('active');
            $(this).addClass('active');
            $('#tab2 .date-section').css('display', '').show();
        }
    })

    // Search list selection toggle 
    $("#tab2 .right-panel .list").on('click', '.list-item', function() {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            
        } else {
            $("#tab2 .right-panel .list-item").removeClass('active');
            $(this).addClass('active');
            
        }
    })
    

    // Columns list selection toggle for tab2 middle list (sorting)
    $("#tab2 .middle-panel .list").on('click', '.list-item', function() {
        $(this).toggleClass('active');
    });
    

    // Extending all table list by default
    $("#tab2 .selected-tables .table-name").addClass('active');

    // Selected tables list selection toggle - middle panel
    $("#tab2 .selected-tables .table-name").click(function() {
        $(this).toggleClass('active');
    })


    // Generate Report button 
    $('#tab2 .generate-report-btn').click(function() {
        var activeListItems = $('#tab1 .list-item.active').map(function() {
            return $(this).text().trim(); 
        }).get(); 
        // distinct column names
        // activeListItems = [... new Set(activeListItems)];

        var activeTableNames = $('#tab1 .card.active .title').map(function() {
            return $(this).text().trim(); 
        }).get();

        var reportName = $('.report-name-title').text();

        var activeDateTimeColumn = $('#tab2 .initial-section .list-item.active').text();
        var activeSearchColumn = $('#tab2 .right-panel .list-item.active').text();
        var reportStartDate = $('#reportrange').data('daterangepicker').startDate.format('DD-MM-YYYY');
        var reportEndDate = $('#reportrange').data('daterangepicker').endDate.format('DD-MM-YYYY');

        var columnsForSorting = $('#tab2 .middle-panel .list-item.active').map(function() {
            return $(this).text().trim(); 
        }).get();
        

        // Sending POST request to backend
        $.ajax({
            url: '/dashboard',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                activeListItems: activeListItems,
                activeTableNames: activeTableNames,
                reportName: reportName,
                reportStartDate: reportStartDate,
                reportEndDate: reportEndDate,
                columnsForSorting: columnsForSorting,
                activeDateTimeColumn: activeDateTimeColumn,
                activeSearchColumn: activeSearchColumn
            }),
            success: function(response) {
                console.log('Success:');
                window.location.href = '/report'; 
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
    });

    // --------------------------------------------------------------------------------------------------------------
    // --------------------------------------------------- Report ---------------------------------------------------
    // --------------------------------------------------------------------------------------------------------------
       
    var currentPage = 1;
    var rowsPerPage = 10;
    var pageWindow = 5;
    var totalPages = Math.ceil($('.table-wrapper tbody tr').length / rowsPerPage);
    displayTableRows(currentPage, rowsPerPage);
    paginationControls(totalPages, currentPage);

    function displayTableRows(currentPage, rowsPerPage) {
        var start = (currentPage - 1) * rowsPerPage;
        var end = start + rowsPerPage;
        $('.table-wrapper tbody tr').hide().slice(start, end).show();
    }

    function paginationControls(totalPages, currentPage) {
        var $paginationContainer = $('.pagination-container');
        $paginationContainer.empty();

        var maxLeft = currentPage - Math.floor(pageWindow / 2);
        var maxRight = currentPage + Math.floor(pageWindow / 2);

        if (maxLeft < 1) {
            maxLeft = 1;
            maxRight = pageWindow;
        }

        if (maxRight > totalPages) {
            maxLeft = totalPages - (pageWindow - 1);

            if (maxLeft < 1) {
                maxLeft = 1;
            }
            maxRight = totalPages;
        }

        $paginationContainer.append(`<button value=${1} class="page ${currentPage == 1 ? 'disabled' : ''}">&#171; First</button>`);
        $paginationContainer.append(`<button value=${currentPage - 1} class="page page-prev ${currentPage == 1 ? 'disabled' : ''}">Prev</button>`);

        for (var page = maxLeft; page <= maxRight; page++) {
            $paginationContainer.append(`<button value=${page} class="page numb">${page}</button>`);
            if (page === currentPage) {
                $paginationContainer.find('.page.numb').last().addClass('active');
            }
        }

        $paginationContainer.append(`<button value=${currentPage + 1} class="page page-next ${currentPage == totalPages ? 'disabled' : ''}">Next</button>`);
        $paginationContainer.append(`<button value=${totalPages} class="page ${currentPage == totalPages ? 'disabled' : ''}">Last &#187;</button>`);

        $paginationContainer.find('.disabled').prop('disabled', true);

        $paginationContainer.find('.page').not('.disabled').on('click', function() {
            currentPage = Number($(this).val());            
            displayTableRows(currentPage, rowsPerPage);
            paginationControls(totalPages, currentPage);
        });


    }

    // Sorting table columns 
    const tableRows = $('.table-wrapper tbody tr').get();

    $('.table-wrapper th.sort').each(function() {
        let sort_asc = true;
        $(this).on('click', function() {
            var columnName = $(this).data('column-name');

            $('.table-wrapper th.sort').removeClass('active');
            $(this).addClass('active');

            $('.table-wrapper td').removeClass('active');
            console.log(tableRows);
            tableRows.forEach(row => {
                $(row).find('td').eq(columnName).addClass('active');
            });

            $(this).toggleClass('asc', sort_asc);
            sort_asc = !$(this).hasClass('asc');

            sortTable(columnName, sort_asc);
        });
    });
    
    
    function sortTable(column, sort_asc) {
        tableRows.sort(function(a, b) {
            var first_row = $(a).find(`td.${column}`).text().toLowerCase().trim();
            var second_row = $(b).find(`td.${column}`).text().toLowerCase().trim();

            var first_row_num = isNaN(+first_row) ? first_row : +first_row;
            var second_row_num = isNaN(+second_row) ? second_row : +second_row;
    
            if (typeof first_row_num === 'number' && typeof second_row_num === 'number') {
                return sort_asc ? (second_row_num - first_row_num) : (first_row_num - second_row_num);
            } else {
                return sort_asc ? (first_row < second_row ? 1 : -1) : (first_row < second_row ? -1 : 1);
            }
        });

        $.each(tableRows, function(index, row) {
            $('.table-wrapper tbody').append(row);
        });
        displayTableRows(currentPage, rowsPerPage);
        paginationControls(totalPages, currentPage);
    }

    // Search table by chosen column
    var searchColumn = $('.leads-table').data('search-column');
    $("#name-search").keyup(function() {
        searchTable(searchColumn);    
    });

    // Export to CSV
    var $exportCsvBtn = $('#toCSV');

    $exportCsvBtn.click(function() {
        var reportName = $('.report-name-final').text().trim();
        
        var $table = $('.leads-table');

        const tHeads = $table.find('thead th'),
            tRows = $table.find('tbody tr.visible');

        var headings = [];
        tHeads.each(function() {
            var head = $(this).text().trim().split(' ');
            var headText = head.splice(0, head.length - 1).join(" ").toLowerCase();
            headings.push(headText);        
        });
        var headingsCsv = headings.join(',');

        var rows = []
        tRows.each(function() {
            var row = [];
            $(this).find('td').each(function() {
                row.push($(this).text().trim());
            });
            rows.push(row.join(','));
        });
        var rowsCSV = rows.join('\n');
        
        var csvData = headingsCsv + "\n" + rowsCSV;
        
        downloadFile(csvData, 'csv', reportName);
    });
    
    // Export to Excel
    var $exportExcelBtn = $('#toExcel');

    $exportExcelBtn.click(function() {
        var reportName = $('.report-name-final').text().trim();
        
        var $table = $('.leads-table');

        const tHeads = $table.find('thead th'),
            tRows = $table.find('tbody tr.visible');

        var headings = [];
        tHeads.each(function() {
            var head = $(this).text().trim().split(' ');
            var headText = head.splice(0, head.length - 1).join(" ").toLowerCase();
            headings.push(headText);        
        });
        var headingsExcel = headings.join('\t');

        var rows = []
        tRows.each(function() {
            var row = [];
            $(this).find('td').each(function() {
                row.push($(this).text().trim());
            });
            rows.push(row.join('\t'));
        });
        var rowsExcel = rows.join('\n');
        
        var excelData = headingsExcel + "\n" + rowsExcel;
        
        downloadFile(excelData, 'excel', reportName);
    });
    
    // Download function
    function downloadFile(data, fileType, fileName='') {
        const mimeTypes = {
            'csv': 'text/csv',
            'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        if (!mimeTypes[fileType]) {
            console.error("Unsupported file type: " + fileType);
            return;
        }

        const blob = new Blob([data], { type: mimeTypes[fileType] });
        const url = URL.createObjectURL(blob);

        const a = $(document.createElement('a'))
            .attr('download', fileName)
            .attr('href', url)
            .css('display', 'none');    
            
        $('body').append(a);
        a[0].click();
        a.remove();
    }

});



function applyFilters() {
    var leadStatus = $(".lead-status-select").val().toUpperCase();
    var nameValue = $("#name-search").val().toUpperCase();
    $('.leads-table tbody tr').each(function() {
        var tdLeadStatus = $(this).find(" .lead_status").text().toUpperCase();
        var tdName = $(this).find(" .first_name").text().toUpperCase();

        var matchesStatus = (leadStatus === tdLeadStatus || leadStatus === 'ALL');
        var matchesName = (tdName.indexOf(nameValue) > -1 || nameValue === '');
        

        if (matchesName && matchesStatus) {
            $(this).addClass('visible').show();
        } else {
            $(this).removeClass('visible').hide();
        }
    });
    displayTableRows(currentPage, rowsPerPage);
}

function filterTableByLeadStatus() {
    var value = $(".lead-status-select").val().toUpperCase();
    $('.leads-table tbody tr').each(function() {
        var tdText = $(this).find(" .lead_status").text().toUpperCase();
        if (tdText === value || value === "All") {
            $(this).css('display', '');
        }
        else {
            $(this).css('display', 'none');
        }
    });
}



function searchTable(searchColumn) {
    var nameValue = $("#name-search").val().toUpperCase();
    $('.leads-table tbody tr').each(function() {        
        var tdText = $(this).find(`td.${searchColumn}`).text().toUpperCase();        
        var matchesName = (tdText.indexOf(nameValue) > -1 || nameValue === '');

        if (matchesName) {
            $(this).css('display', '').addClass('visible').show();
        }
        else {
            $(this).css('display', 'none').removeClass('visible').hide();
        }
    });
}










