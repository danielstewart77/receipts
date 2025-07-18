$(document).ready(function(){
    $('#loginForm').submit(function(event){
        event.preventDefault();
        
        const formData = {
            username: $('#username').val(),
            password: $('#password').val()
        };
        
        $.ajax({
            type: 'POST',
            url: '/login',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(response){
                $('#queryResult').html('<p class="success">Login successful. Access token: ' + response.access_token + '</p>');
            },
            error: function(xhr, status, error){
                const err = JSON.parse(xhr.responseText);
                $('#queryResult').html('<p class="error">' + err.error + '</p>');
            }
        });
    });
});