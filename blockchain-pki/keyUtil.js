

$( document ).ready(function() {
    console.log( "ready!" );
  
	document.addEventListener('DOMContentLoaded', function() {
	     var generateKeysUI = document.getElementById('getKeys');
		generateKeysUI.onclick = function(element) {
		  generateKey();
		};
	});
});
