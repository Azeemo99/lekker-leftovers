document.addEventListener('DOMContentLoaded', function(){
    navigator.geolocation.getCurrentPosition(function (position){
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const map = L.map('map').setView([userLat, userLng], 13);
       
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
 
        // Create custom red icon
        const redIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
 
        // User marker (blue default)
        L.marker([userLat, userLng], { riseOnHover: true })
            .addTo(map)
            .bindPopup('You are here')
            .openPopup();
            
        const listings = window.orderListings || [];
        listings.forEach(listing => {
        if (listing.latitude && listing.longitude) {
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${listing.latitude},${listing.longitude}&travelmode=driving`;

         // Use red icon for listing markers
            L.marker([listing.latitude, listing.longitude], { 
            icon: redIcon,
            riseOnHover: true 
        })
        .addTo(map)
        .bindPopup(`
            <strong>${listing.product_name}</strong><br>
            ${listing.description}<br>
            <em>Pickup: ${listing.pickupTime}</em><br>
            <a href="/product/${listing.product_id}">View order</a><br>
            <a href="${directionsUrl}" target="_blank">Get Directions</a>
        `);
            }
        });

    });
});