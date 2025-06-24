document.addEventListener('DOMContentLoaded', function () {
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const squareFootageError = document.getElementById('squareFootageError');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const bhkValueInput = document.getElementById('bhkValue');
    const projectTypeSelect = document.getElementById('projectType');
    const startDateInput = document.getElementById('startDate');

    // Set the default date to today
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    startDateInput.value = formattedToday;

    // Show/hide BHK selector based on project type
    projectTypeSelect.addEventListener('change', function () {
        const bhkGroup = document.getElementById('bhkGroup');
        bhkGroup.style.display = this.value === 'residential' ? 'block' : 'none';
    });

    // BHK toggle functionality
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            bhkValueInput.value = this.getAttribute('data-bhk');
        });
    });

    // Average square footage by BHK
    const bhkSizes = {
        1: 550,
        2: 950,
        3: 1400,
        4: 2000,
        5: 3000
    };

    // Base construction costs per square foot (in INR)
    const baseCosts = {
        residential: 2200,
        commercial: 2800,
        industrial: 1800,
        renovation: 1500
    };

    // Quality multipliers
    const qualityMultipliers = {
        basic: 0.8,
        standard: 1.0,
        premium: 1.3,
        luxury: 1.8
    };

    // Season multipliers (based on start month)
    function getSeasonMultiplier(dateString) {
        if (!dateString) return 1.0;

        const date = new Date(dateString);
        const month = date.getMonth(); // 0-11 (Jan-Dec)

        // Monsoon season (higher costs due to challenges)
        if (month >= 5 && month <= 8) { // June-September
            return 1.08; // 8% increase
        }
        // Winter season (typically lower costs)
        else if (month >= 10 || month <= 1) { // November-February
            return 0.95; // 5% decrease
        }
        // Rest of the year (spring, early summer, fall)
        else {
            return 1.0; // Standard rate
        }
    }

    // Get season name for display
    function getSeasonName(dateString) {
        if (!dateString) return "Standard";

        const date = new Date(dateString);
        const month = date.getMonth(); // 0-11 (Jan-Dec)

        if (month >= 5 && month <= 8) return "Monsoon Season";
        else if (month >= 10 || month <= 1) return "Winter Season";
        else return "Standard Season";
    }

    // Urgency multiplier (if project starts within 4 months)
    function getUrgencyMultiplier(dateString) {
        if (!dateString) return 1.0;

        const projectStartDate = new Date(dateString);
        const today = new Date();
        const fourMonthsLater = new Date(today);
        fourMonthsLater.setMonth(today.getMonth() + 4);

        // If project starts within 4 months, apply 10% increase
        if (projectStartDate <= fourMonthsLater) {
            return 1.10; // 10% increase
        } else {
            return 1.0; // No increase
        }
    }

    // Cost breakdown percentages
    const costBreakdown = {
        foundation: 0.12,
        framing: 0.16,
        exterior: 0.14,
        majorSystems: 0.15,
        interior: 0.23,
        landscaping: 0.03,
        permits: 0.02,
        labor: 0.38,
        contingency: 0.10
    };

    calculateBtn.addEventListener('click', function () {
        let squareFootage = parseFloat(document.getElementById('squareFootage').value);
        const projectType = document.getElementById('projectType').value;
        const quality = document.getElementById('quality').value;
        const bhk = parseInt(bhkValueInput.value);
        const startDate = document.getElementById('startDate').value;

        // If square footage is not provided, use BHK standard size
        if (isNaN(squareFootage) || squareFootage <= 0) {
            if (projectType === 'residential') {
                squareFootage = bhkSizes[bhk];
                squareFootageError.style.display = 'none';
            } else {
                squareFootageError.style.display = 'block';
                resultsDiv.style.display = 'none';
                return;
            }
        } else {
            squareFootageError.style.display = 'none';
        }

        // Calculate base cost
        const baseCostPerSqFt = baseCosts[projectType];
        const qualityMultiplier = qualityMultipliers[quality];
        const seasonMultiplier = getSeasonMultiplier(startDate);
        const urgencyMultiplier = getUrgencyMultiplier(startDate);

        const adjustedCostPerSqFt = baseCostPerSqFt * qualityMultiplier * seasonMultiplier * urgencyMultiplier;
        const totalEstimatedCost = adjustedCostPerSqFt * squareFootage;

        // Generate results HTML
        let html = '';

        // Project details
        html += `<div class="result-item"><span>Project Type:</span> <span>${getProjectTypeName(projectType)}</span></div>`;

        if (projectType === 'residential') {
            html += `<div class="result-item"><span>Configuration:</span> <span>${bhk} BHK</span></div>`;
        }

        html += `<div class="result-item"><span>Square Footage:</span> <span>${squareFootage.toLocaleString()} sq ft</span></div>`;
        html += `<div class="result-item"><span>Quality Standard:</span> <span>${quality.charAt(0).toUpperCase() + quality.slice(1)}</span></div>`;
        html += `<div class="result-item"><span>Planned Start Date:</span> <span>${formatDate(startDate)}</span></div>`;
        html += `<div class="result-item"><span>Season Adjustment:</span> <span>${getSeasonName(startDate)} (${(seasonMultiplier > 1 ? "+" : "") + ((seasonMultiplier - 1) * 100).toFixed(0)}%)</span></div>`;
        html += `<div class="result-item"><span>Urgency Adjustment:</span> <span>${urgencyMultiplier > 1 ? "10% increase (within 4 months)" : "No urgency adjustment"}</span></div>`;
        html += `<div class="result-item"><span>Base Cost per sq ft:</span> <span>₹${baseCostPerSqFt.toFixed(2)}</span></div>`;
        html += `<div class="result-item"><span>Adjusted Cost per sq ft:</span> <span>₹${adjustedCostPerSqFt.toFixed(2)}</span></div>`;

        // Cost breakdown
        html += '<h3>Cost Breakdown</h3>';

        for (const [category, percentage] of Object.entries(costBreakdown)) {
            if (category !== 'contingency') {  // Exclude contingency from initial breakdown
                const categoryAmount = totalEstimatedCost * percentage;
                const categoryName = formatCategoryName(category);
                html += `<div class="result-item"><span>${categoryName}:</span> <span>₹${categoryAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>`;
            }
        }

        // Subtotal before contingency
        const subtotal = totalEstimatedCost * (1 - costBreakdown.contingency);
        html += `<div class="result-item"><span>Subtotal:</span> <span>₹${subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>`;

        // Contingency
        const contingencyAmount = totalEstimatedCost * costBreakdown.contingency;
        html += `<div class="result-item"><span>Contingency (10%):</span> <span>₹${contingencyAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>`;

        // Total
        html += `<div class="result-item"><span>Total Estimated Cost:</span> <span>₹${totalEstimatedCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>`;

        // Display results
        resultsContent.innerHTML = html;
        resultsDiv.style.display = 'block';

        // Scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    });

    // Helper functions
    function getProjectTypeName(type) {
        const names = {
            residential: 'Residential Building',
            commercial: 'Commercial Building',
            industrial: 'Industrial Building',
            renovation: 'Renovation'
        };
        return names[type] || type;
    }

    function formatCategoryName(category) {
        if (category === 'majorSystems') return 'Major Systems (Plumbing, Electrical, HVAC)';
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    function formatDate(dateString) {
        if (!dateString) return "Not specified";

        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-IN', options);
    }
});