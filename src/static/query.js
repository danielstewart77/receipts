$(document).ready(function () {

    $(".query-input").focus(function () {
        $(".query-result").css("height", "60px");
    });
    $(".query-input").blur(function () {
        $(".query-result").css("height", "60vh");
        if ($(".query-input").text().length === 0) {
            $(".query-input").empty();
        }
    });
    $("#queryButton").click(function () {
        var query = $("#queryInput").text().trim();
        if (query) {
            // Start animation
            $(this).animate({
                opacity: 0.5
            }, 500);
            $(".query-result").animate({ backgroundColor: '#333' }, 500); // Animate background color to dodgerblue
            // Start animation on query-input
            $(".query-input").addClass('loading'); // Add loading class to start CSS animation
            $.ajax({
                url: "/query",
                type: "POST",
                data: JSON.stringify({ "query": query }),
                contentType: "application/json",
                dataType: "html",
                success: function (data) {
                    var resultDiv = $("#queryResult");
                    if (data) {
                        const htmlContent = $('<div>').html(data);
                        resultDiv.html(htmlContent);
                        resultDiv.find("code").each(function () {
                            var classAttr = $(this).attr('class');
                            if (classAttr && classAttr.includes('-') && classAttr.includes('language')) {
                                var language = classAttr.split('-')[1]; // Extract language from class
                                $(this).before('<div class="copy-control"><span>' + language + '</span><button class="copy-control-button"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 4C10.8954 4 10 4.89543 10 6H14C14 4.89543 13.1046 4 12 4ZM8.53513 4C9.22675 2.8044 10.5194 2 12 2C13.4806 2 14.7733 2.8044 15.4649 4H17C18.6569 4 20 5.34315 20 7V19C20 20.6569 18.6569 22 17 22H7C5.34315 22 4 20.6569 4 19V7C4 5.34315 5.34315 4 7 4H8.53513ZM8 6H7C6.44772 6 6 6.44772 6 7V19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19V7C18 6.44772 17.5523 6 17 6H16C16 7.10457 15.1046 8 14 8H10C8.89543 8 8 7.10457 8 6Z" fill="currentColor"></path></svg>Copy code</button></div>');
                            }
                        });
                    } else {
                        resultDiv.text("No results found.");
                    }
                    // Stop animation
                    $("#queryButton").animate({
                        opacity: 1
                    }, 500);
                    $(".query-result").animate({
                        backgroundColor: '#000'
                    }, 500); // Animate background color back to original
                    // Stop animation on query-input
                    $(".query-input").removeClass('loading'); // Remove loading class to stop CSS animation
                },
                error: function (xhr, status, error) {
                    console.error(error);
                    // Stop animation
                    $("#queryButton").animate({
                        opacity: 1
                    }, 500);
                    // Stop animation on query-input
                    $(".query-input").removeClass('loading'); // Remove loading class to stop CSS animation
                    $(".query-result").animate({
                        backgroundColor: '#000'
                    }, 500); // Animate background color back to original
                }
            });
        }
    });

    // Add click event handler for copy-control-button
    $(document).on('click', '.copy-control-button', function () {
        var codeContent = $(this).closest('.copy-control').next('code').text();
        var tempInput = $("<textarea>");
        $("body").append(tempInput);
        tempInput.val(codeContent).select();
        document.execCommand("copy");
        tempInput.remove();
    });
});