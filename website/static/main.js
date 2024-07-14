
$(document).ready(function() {
    $(".lead-status-select").change(applyFilters)
    $("#name-search").keyup(applyFilters)

    
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


    // Default table active
    // $(".card").first().addClass('active');
    // const tableName = $(".card").first().attr('table-name');
    // $.ajax({
    //     url: `/get-columns/${tableName}`,
    //     type: 'GET',
    //     dataType: 'json',
    //     success: function(columns) {
    //         const $list = $(`#tab1 .middle-panel .list.${tableName}`);
    //         $list.empty(); 
    //         $.each(columns, function(index, column) {
    //             const $listItem = $('<div></div>', {
    //                 'class': `list-item selectable ${column}`,
    //                 'html': `${column}`
    //             });
    //             $list.append($listItem); 
    //         });
    //     }
    // });

    
    

    var $activeTableNames = $('#tab1 .card.active').map(function() {
        return $(this).attr('table-name'); 
    }).get();

    $(`#tab1 .middle-panel .table-container`).css('display', 'none');

    // Showing the name of the tables and its columns 
    $(".card").click(function() {
        const tableName = $(this).attr('table-name');
        // $(".card").removeClass("active");
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            $(this).find('.icon').css('transform', '');
            $(`#tab1 .middle-panel .list.${tableName} .list-item`).each(function() {
                $(this).removeClass('active').remove();        
            })
            $(`#tab1 .middle-panel .list.${tableName} .list-item`).hide();
            $activeTableNames = $activeTableNames.filter(tableName => tableName !== $(this).attr('table-name'));
            $(`#tab1 .middle-panel .table-container.${tableName}`).css('display', 'none');
            // $('.icon').css('transform', '');
        } else {
            $(this).addClass('active');
            $activeTableNames.push($(this).attr('table-name'));
            $(`#tab1 .middle-panel .table-container.${tableName}`).css('display', '');

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
                        $list.append($listItem); 
                    });
                }
            });
        }
        
        // $(this).toggleClass('active');

        // Card - icon moving functionality on each click
        var $icon = $(this).find('.icon');
        var $iconContainer = $(this);

        if ($iconContainer.hasClass('active')) {
            var containerWidth = $iconContainer.width();
            var iconWidth = $icon.width();
            var distanceToMove = containerWidth - iconWidth;
            $activeIcon = $('.card.active .icon')

            $activeIcon.css('transform', 'translateX(' + distanceToMove + 'px)');
        } else {

        };
    });


    // Columns list selection toggle for tab1
    $("#tab1 .middle-panel .list").on('click', '.list-item', function() {
        $(this).toggleClass('active');
        
    });

    $('#selectAllColumns').click(function() {
        $('#tab1 .middle-panel .list-item').addClass('active');
    
    });

    // View Type Selection
    $('#tab1 .right-panel .view-item').click(function() {
        $(this).toggleClass('active');
    })

    // Extending all table list by default
    $("#tab1 .selected-tables .table-name").addClass('active');
    

    // -------------------------------------------------- Tab 2 --------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------

    $('#tab1 .selectable').click(function() {
        // Displaying selected columns in tab2
        var activeColumns = $('#tab1 .list-item.active').map(function() {
            return $(this).text().trim(); 
        }).get(); 

        var $activeTableNames = $('#tab1 .card.active').map(function() {
            return $(this).attr('table-name'); 
        }).get();
        

        // in middle-panel
        $('#tab2 .middle-panel .table-name').each(function() {
            var tableName = $(this).attr('table-name');
            if ($activeTableNames.includes(tableName)) {
                $(this).parent().css('display', '');

                $.ajax({
                    url: `/get-columns/${tableName}`,
                    type: 'GET',
                    dataType: 'json',
                    success: function(columns) {
                        const $middleList = $(`#tab2 .middle-panel .list.${tableName}`);                        
                        $middleList.empty();             
                        $.each(columns, function(index, column) {
                            if (activeColumns.includes(column)) {
                                const $listItem = $('<div></div>', {
                                    'class': `list-item ${column}`,
                                    'html': `${column}`
                                });
                                $middleList.append($listItem);                             
                            }                        
                        });
                    }
                });
            } else {
                $(this).parent().css('display', 'none');
            }
        });

        // right panel
        $('#tab2 .right-panel .table-name').each(function() {
            var tableName = $(this).attr('table-name');
            if ($activeTableNames.includes(tableName)) {
                $(this).parent().css('display', '');

                $.ajax({
                    url: `/get-columns/${tableName}`,
                    type: 'GET',
                    dataType: 'json',
                    success: function(columns) {
                        const $rightList = $(`#tab2 .right-panel .list.${tableName}`);                                     
                        $rightList.empty();                 
                        $.each(columns, function(index, column) {
                            if (activeColumns.includes(column)) {
                                const $listItem = $('<div></div>', {
                                    'class': `list-item ${column}`,
                                    'html': `${column}`
                                });                          
                                $rightList.append($listItem);                            
                            }                        
                        });
                    }
                });
            } else {
                $(this).parent().css('display', 'none');
            }
        });

        var activeTableNames = $('#tab1 .card.active').map(function() {
            return $(this).text().trim(); 
        }).get();

        // displaying columns with Date or Datetime
        $.ajax({
            url: `/datetime-columns`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                activeColumns: activeColumns,
                activeTableNames: activeTableNames
            }),
            dataType: 'json',
            success: function(columns) {                
                const $list = $('#tab2 .initial-section .list');
                $list.empty(); 
                $.each(columns, function(index, column) {
                    const $listItem = $('<div></div>', {
                        'class': 'list-item',
                        'html': `${column}`
                    });
                    $list.append($listItem); 
                });
            }
        });
    })

    $('#tab2 .date-section').css('display', 'none');
    // Datetime list selection toggle 
    $("#tab2 .initial-section .list").on('click', '.list-item', function() {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            $('#tab2 .date-section').css('display', 'none');
        } else {
            $("#tab2 .initial-section .list-item").removeClass('active');
            $(this).addClass('active');
            $('#tab2 .date-section').css('display', '');
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
    

    // Columns list selection toggle for tab2 middle list
    $("#tab2 .middle-panel .list").on('click', '.list-item', function() {
        $(this).toggleClass('active');
    });
    

    // Extending all table list by default
    $("#tab2 .selected-tables .table-name").addClass('active');

    // Selected tables list selection toggle - middle panel
    $("#tab2 .middle-panel .selected-tables .table-name").click(function() {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            
        } else {
            // $("#tab2 .middle-panel .selected-tables .table-name").removeClass('active');
            $(this).addClass('active');            
        }
    })

    // Selected tables list selection toggle - right panel
    $("#tab2 .right-panel .selected-tables .table-name").click(function() {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            
        } else {
            $("#tab2 .right-panel .selected-tables .table-name").removeClass('active');
            $(this).addClass('active');            
        }
    })
    


    // Generate Report button 
    $('#tab2 .generate-report-btn').click(function() {
        var activeListItems = $('#tab1 .list-item.active').map(function() {
            return $(this).text().trim(); 
        }).get(); 

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
            $(this).show();
        } else {
            $(this).hide();
        }
    });
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



function searchTableByName() {
    var value = $("#name-search").val();
    var searchValue = value.toUpperCase();
    $('.leads-table tbody tr').each(function() {
        console.log(searchValue);
        var tdText = $(this).find("td:nth-child(3)").text().toUpperCase();
        if (tdText.indexOf(searchValue) > -1) {
            $(this).css('display', '');
        }
        else {
            $(this).css('display', 'none');
        }
    });
}










