$(document).ready(function() {
    function validateForm() {
        const usernameError = $("#usernameError").text();
        const passwordError = $("#passwordError").text();
        const isFormValid = usernameError === "" && passwordError === "";
        $("#registerSubmit").prop("disabled", !isFormValid);
    }

    $("#username").on("input", function() {
        const username = $(this).val();
        if (username.length > 0) {
            $.ajax({
                url: "/currentuser",
                method: "POST",
                data: {username: username},
                success: function(response) {
                    if (response.exists) {
                        $("#usernameError").text("Username is already taken.");
                    } else {
                        $("#usernameError").text("");
                    }
                    validateForm();
                }
            });
        } else {
            $("#usernameError").text("");
            validateForm();
        }
    });

    $("#password").on("input", function() {
        const password = $(this).val();
        const passwordError = validatePassword(password);
        $("#passwordError").text(passwordError);
        validateForm();
    });
});

function validatePassword(password) {
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one digit.";
    }
    if (!/[@$!%*?&]/.test(password)) {
        return "Password must contain at least one special character (@$!%*?&).";
    }
    return "";
}