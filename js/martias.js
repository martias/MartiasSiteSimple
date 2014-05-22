//function emailConsulta(newConsulta, callback) {
//$("#commentForm").validate();


jQuery(document).ready(function() {
  var form = jQuery('#commentForm'); // contact form
  var submit = jQuery('#submitButton');  // submit button
  // var webServiceURL = "http://localhost:16080/email";
  var webServiceURL = "http://www.martiasmobi.appspot.com/email";

  // form submit event
  form.on('submit', function(e) {
    e.preventDefault(); // prevent default form submit

    jQuery.ajax({
      url: webServiceURL, // form action url
      type: 'POST', // form submit method get/post
      dataType: 'html', // request type html/json/xml
      data: form.serialize(), // serialize form data 
      beforeSend: function() {
        submit.val('Sending....'); // change submit button text
      },
      success: function(data) {
        alert.html(data).fadeIn(); // fade in response data
        form.trigger('reset'); // reset form
        submit.val('Send');
 	    jQuery('#successMsg').show(500);
    	setTimeout(function() {
			jQuery('#successMsg').hide(500);
		}, 4000); 
      },
      error: function(e) {
        console.log(e);
        submit.val('Send');
		jQuery('#errorMsg').show(500);
    	setTimeout(function() {
			jQuery('#errorMsg').hide(500);
		}, 4000); 
      }
    });
  });
});



// jQuery('input#submitButton').click( function() {
// 	webServiceURL = "http://localhost:16080/email";
// 	//webServiceURL = "http://www.martiasmobi.appspot.com/email";
// 	// console.log(jQuery('form#commentForm').serialize());

// 	var emailString = jQuery('#cemail').val();
// 	var commentString = jQuery('#ccomment').val();
// 	// console.log(emailString + commentString);
// 	if (emailString !== "" && commentString !== "") {
// 	    jQuery.ajax({
// 	        url: webServiceURL,
// 	        type: 'POST',
// 	        dataType: 'json',
// 	        data: jQuery('form#commentForm').serialize(),
// 	        success: function(data) {
// 	            console.log("POST success");
// 	            jQuery('#successMsg').show(500);
//             	setTimeout(function() {
// 					jQuery('#successMsg').hide(500);
// 				}, 4000); 
// 	        },
// 			error: function (xhr) { // When Service call fails  
// 				console.log(xhr.responseText); 
// 				jQuery('#errorMsg').show(500);
//             	setTimeout(function() {
// 					jQuery('#errorMsg').hide(500);
// 				}, 4000); 
// 			}   
// 	    });
// 	}
// });

// function emailConsulta() {
// 	var userMessage = "";

//    callWSContact.getConfirmationMsg(userMessage, function(confirmationMsg) {

//   	  var state = confirmationMsg.state;
// 	  if (state == "OK") {
// 		alert('Consulta enviada con exito', 'Consulta');
// 	  }
// 	  else {
// 		alert('Error en el envio de su consulta', 'Consulta');
// 	  }
// 	});
// }


///Consumo de WS de IOL
// Llama al Ws para registrar nuevos usuarios en IOL
// callWSContact = {
//     getConfirmationMsg: function (newConsulta, callback) {

// 		var confirmationMsg = new Object();

//         idCobraiding = localStorage.idCobraiding;
//         publickey = localStorage.publickey;
//         var token = localStorage.Token;
		
// 		//var webServiceURL ='http://invertironline.com.ar/iolweb/ServiciosAjax/Mobile/Soporte/WSConsulta.aspx?';
//         //var foo = "token=" + token + "&idcobranding=" + idCobraiding + "&publickey=" + publickey + "&consulta=" + newConsulta.consulta + "&idAsunto=" + newConsulta.idAsunto;

//         webServiceURL = "http://localhost:16080/testemail";

//         //webServiceURL = "http://www.martiasmobi.appspot.com/testemail";
//         content = "";

//         var data = { "mail" : "visit@mail.com" , "message" : "visit message" };

// 		jQuery.ajax({
// 		    type: "POST",
// 		    url: webServiceURL,
// 		    contentType: "application/json; charset=utf-8",
// 		    dataType: "json", //Expected data format from server    
// 		    data: data,
// 		    success: function(data) {
// 		        alert("AJAX done");
// 		 	},
// 		    error: function (xhr) { console.log(xhr.responseText); } // When Service call fails    
// 		});  

// 		content = "?mail=visit@mail.com&message=messageFromVist";

//        	jQuery.ajax({
// 			  type: "GET",
// 			  url: encodeURI(webServiceURL + content),
// 			  contentType: "application/json; charset=utf-8",
// 			  dataType: "json",
// 			  complete: function (response) {
// 				  var jsonp = response.responseText;
// 				  var obj = jQuery.parseJSON(jsonp);

// 				  //OK [{"Estado":"OK","Mensaje":"Se registro correctamente. UserName: kjdksaj"}]
// 				  //ERROR [{"Estado":"Error","Mensaje":"Se produjo un error al intentar registrarse"}]
					  
// 				  confirmationMsg.state = obj[0].State;
// 				  confirmationMsg.message = obj[0].Message;
// 				  callback.call(this, confirmationMsg);
// 			  }
// 		});
//    	}
// }