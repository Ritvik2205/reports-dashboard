
$(document).ready(function() {
    $(".lead-status-select").change(applyFilters)
    $("#name-search").keyup(applyFilters)

    // Tabs logic
    var $tablink = $("tablink");
    var $tabContent = $(".tabcontent");
    $tablink.click(function(e) {
        e.preventDefault();
        var $this = $(this);
        var $target = $($this.attr('href'));
        $tablink.removeClass('active');
        $tabContent.removeClass('active');
        $this.addClass('active');
        $target.addClass('active');
    });

    $(".tablink").click(function() {
        $(".tablink").removeClass("active");
        $(".tabcontent").removeClass("active").hide();

        $(this).addClass("active");

        var $tab = $(this).data("tab-value");

        $($tab).addClass("active").show();

    })

    // Report Name entered
    // $('.report-name-enter').click(function() {
    $('.report-name-input').on('input', function() {
        var reportName = $('.report-name-input').val();
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
    $(".card").first().addClass('active');
    const tableName = $(".card").first().attr('table-name');
    $.ajax({
        url: `/get-columns/${tableName}`,
        type: 'GET',
        dataType: 'json',
        success: function(columns) {
            const $list = $('#tab1 .middle-panel .list');
            $list.empty(); 
            $.each(columns, function(index, column) {
                const $listItem = $('<div></div>', {
                    'class': 'list-item selectable',
                    'html': `${column}`
                });
                $list.append($listItem); 
            });
        }
    });

    
    // Card - icon moving functionality
    var $icon = $('.icon');
    var $iconContainer = $icon.parent();

    if ($iconContainer.hasClass('active')) {
        var containerWidth = $iconContainer.width();
        var iconWidth = $icon.width();
        var distanceToMove = containerWidth - iconWidth;
        $activeIcon = $('.card.active .icon')

        $activeIcon.css('transform', 'translateX(' + distanceToMove + 'px)');
    } else {

    };


    // Showing the name of the tables and its columns 
    $(".card").click(function() {
        $(".card").removeClass("active");
        $('.icon').css('transform', '');
        $(this).addClass('active');

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
        
        // Dispaying column names
        const tableName = $(this).attr('table-name');
        $.ajax({
            url: `/get-columns/${tableName}`,
            type: 'GET',
            dataType: 'json',
            success: function(columns) {
                const $list = $('.middle-panel .list');
                $list.empty(); 
                $.each(columns, function(index, column) {
                    const $listItem = $('<div></div>', {
                        'class': 'list-item selectable',
                        'html': `${column}`
                    });
                    $list.append($listItem); 
                });
            }
        });
    })


    // Columns list selection toggle for tab1
    $("#tab1 .middle-panel .list").on('click', '.list-item', function() {
        $(this).toggleClass('active');
        
    });

    $('#selectAllColumns').click(function() {
        $('#tab1 .middle-panel .list-item').addClass('active');
    
    });


    

    // -------------------------------------------------- Tab 2 --------------------------------------------------

    $('#tab1 .middle-panel .selectable').click(function() {
        // Displaying selected columns in tab2
        var activeListItems = $('#tab1 .list-item.active').map(function() {
            return $(this).text().trim(); 
        }).get(); 
        
        // in middle-panel
        const $list = $('#tab2 .middle-panel .list');
        $list.empty(); 
        $.each(activeListItems, function(index, activeListItem) {
            const $listItem = $('<div></div>', {
                'class': 'list-item',
                'html': `${activeListItem}`
            });
            $list.append($listItem); 
        });

        // in right-panel
        const $rightList = $('#tab2 .search-container .list');
        $rightList.empty(); 
        $.each(activeListItems, function(index, activeListItem) {
            const $listItem = $('<div></div>', {
                'class': 'list-item',
                'html': `${activeListItem}`
            });
            $rightList.append($listItem); 
        });

        // displaying columns with Date or Datetime
        $.ajax({
            url: `/datetime-columns`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                activeListItems: activeListItems
            }),
            dataType: 'json',
            success: function(columns) {
                console.log(columns);
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

    // Datetime list selection toggle 
    $("#tab2 .initial-section .list").on('click', '.list-item', function() {
        $("#tab2 .initial-section .list-item").removeClass('active');
        $(this).toggleClass('active');
    })

    // Search list selection toggle 
    $("#tab2 .right-panel .list").on('click', '.list-item', function() {
        $("#tab2 .right-panel .list-item").removeClass('active');
        $(this).toggleClass('active');
    })
    

    // Columns list selection toggle for tab2 middle list
    $("#tab2 .middle-panel .list").on('click', '.list-item', function() {
        $(this).toggleClass('active');
    });
    
    
   


    // Generate Report button 
    $('.generate-report-btn').click(function() {
        var activeListItems = $('#tab1 .list-item.active').map(function() {
            return $(this).text().trim(); 
        }).get(); 

        var activeCardTableName = $('.card.active .title').text().trim();

        var reportName = $('.report-name-title').val();

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
                activeCardTableName: activeCardTableName,
                reportName: reportName,
                reportStartDate: reportStartDate,
                reportEndDate: reportEndDate,
                columnsForSorting: columnsForSorting,
                activeDateTimeColumn: activeDateTimeColumn,
                activeSearchColumn: activeSearchColumn
            }),
            success: function(response) {
                console.log('Success:', response);
                window.location.href = '/leads'; 
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










