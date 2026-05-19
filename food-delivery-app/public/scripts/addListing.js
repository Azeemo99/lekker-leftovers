
document.addEventListener('DOMContentLoaded', function () {
    const quantity = document.getElementById("quantity");
    quantity.addEventListener("keydown", (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
    
      e.preventDefault();
    }
    });
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            document.getElementById('latitude').value = position.coords.latitude;
            document.getElementById('longitude').value = position.coords.longitude;
        }, function (err) {
            console.error("Geolocation error:", err.message);
        });
    }
});

