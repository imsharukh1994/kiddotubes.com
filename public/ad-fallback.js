// Ad Fallback Script for Local Development
document.addEventListener('DOMContentLoaded', function() {
    // Immediately show fallback ads for local development
    const adCards = document.querySelectorAll('.ad-card');
    
    adCards.forEach(function(card, index) {
        // Always show fallback content in local development
        showFallbackAd(card, index);
    });
    
    const sidebarAd = document.querySelector('.sidebar-ad');
    if (sidebarAd) {
        showFallbackSidebarAd(sidebarAd);
    }
    
    const bannerAd = document.querySelector('.banner-ad');
    if (bannerAd) {
        showFallbackBannerAd(bannerAd);
    }
    
    const footerAd = document.querySelector('.footer-ad');
    if (footerAd) {
        showFallbackFooterAd(footerAd);
    }
});

function showFallbackAd(adCard, index) {
    // Clear any existing content
    adCard.innerHTML = '';
    
    // Create fallback content
    const adBadge = document.createElement('span');
    adBadge.className = 'ad-badge';
    adBadge.textContent = 'Ad';
    
    const adImage = document.createElement('img');
    adImage.className = 'ad-image';
    adImage.alt = 'Advertisement';
    
    const adContent = document.createElement('div');
    adContent.className = 'ad-content';
    
    const adTitle = document.createElement('h4');
    adTitle.className = 'ad-title';
    
    const adDescription = document.createElement('p');
    adDescription.className = 'ad-description';
    
    const adButton = document.createElement('a');
    adButton.className = 'ad-button';
    adButton.href = '#';
    
    // Set different content based on index
    if (index === 0 || index === undefined) {
        adImage.src = 'https://via.placeholder.com/300x160?text=Educational+Toys';
        adTitle.textContent = 'Educational Toys';
        adDescription.textContent = 'Discover our collection of educational toys that make learning fun.';
        adButton.textContent = 'Learn More';
    } else if (index === 1) {
        adImage.src = 'https://via.placeholder.com/300x160?text=Kids+Books';
        adTitle.textContent = 'Children\'s Books';
        adDescription.textContent = 'Explore our library of children\'s books that inspire imagination.';
        adButton.textContent = 'Shop Now';
    } else {
        adImage.src = 'https://via.placeholder.com/300x160?text=Learning+App';
        adTitle.textContent = 'Learning App';
        adDescription.textContent = 'Download our award-winning learning app for children aged 3-12.';
        adButton.textContent = 'Download';
    }
    
    // Assemble the fallback ad
    adContent.appendChild(adTitle);
    adContent.appendChild(adDescription);
    adContent.appendChild(adButton);
    
    adCard.appendChild(adBadge);
    adCard.appendChild(adImage);
    adCard.appendChild(adContent);
}

function showFallbackSidebarAd(sidebarAd) {
    sidebarAd.innerHTML = `
        <h4 class="sidebar-ad-title">Premium Membership</h4>
        <img src="https://via.placeholder.com/200x120?text=Premium+Membership" alt="Premium Membership" class="sidebar-ad-image">
        <p>Unlock ad-free videos and exclusive content!</p>
        <a href="#" class="sidebar-ad-button">Try Free</a>
    `;
}

function showFallbackBannerAd(bannerAd) {
    bannerAd.innerHTML = `
        <span class="ad-badge">Advertisement</span>
        <a href="#" class="banner-ad-link">
            <img src="https://via.placeholder.com/970x90?text=Kid-Friendly+Content+Banner+Ad" alt="Banner Advertisement" class="banner-ad-image">
        </a>
    `;
}

function showFallbackFooterAd(footerAd) {
    footerAd.innerHTML = `
        <span class="ad-badge">Advertisement</span>
        <a href="#" class="banner-ad-link">
            <img src="https://via.placeholder.com/728x90?text=Family+Friendly+Content" alt="Footer Advertisement" class="banner-ad-image">
        </a>
    `;
}
