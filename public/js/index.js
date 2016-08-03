$.material.init();
$('#cb-password').click(function() {
	$(".password-section").toggle(this.checked);
});

$('form').validate(
		{
			rules : {
				password : {
					minlength : 5,
					required : true
				}
			},
			highlight : function(element) {
				$(element).closest('.form-group').removeClass('has-success')
						.addClass('has-error');
			},
			unhighlight : function(element) {
				$(element).closest('.form-group').removeClass('has-error')
						.addClass('has-success');
			},
			submitHandler : function(form) {
				var password = form.password;
				var roomId = Math.round((Math.random() * 1000000));

				// If the checkbox was selected , replace the password value
				// with a hash
				// else remove the element
				if ($('#cb-password').is(":checked")) {
					password.value = sjcl.codec.hex.fromBits(sjcl.hash.sha256
							.hash(password.value));
				} else {
					password.value = null;
					$('#password').remove();
				}

				form.action = form.action + roomId;
				form.submit();

			}

		});
