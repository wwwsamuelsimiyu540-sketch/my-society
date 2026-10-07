// ==================== CONFIGURATION ====================
// TODO: Replace these strings with your actual online Supabase credentials
const SUPABASE_URL = "https://sklvzkjjjgyiyjhgxqfw.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbHZ6a2pqamd5aXlqaGd4cWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM5OTI5MywiZXhwIjoyMTA2OTc1MjkzfQ.AenQHY0IF60Wz1GrVGC_711DbkDi8IZMYM8l3OaoV08";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== INITIALIZATION ENGINE ====================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("memberForm").addEventListener("submit", registerMember);
    document.getElementById("contributionForm").addEventListener("submit", recordContribution);
    document.getElementById("agriForm").addEventListener("submit", saveHarvestLog);
    document.getElementById("rentalForm").addEventListener("submit", bookEquipmentRental);

    loadInfrastructurePipelines();
    aggregateFinancialPoolFunds();
});

// ==================== TRANSACTIONS (WRITE) ====================
async function registerMember(e) {
    e.preventDefault();
    const name = document.getElementById("memName").value;
    const phone = document.getElementById("memPhone").value;
    const acreage = parseFloat(document.getElementById("memAcreage").value);

    const { data, error } = await supabase
        .from('members')
        .insert([{ full_name: name, phone_number: phone, acreage: acreage }]);

    if (error) alert("❌ Error: " + error.message);
    else { alert("✅ Member saved to cloud database!"); document.getElementById("memberForm").reset(); }
}

async function recordContribution(e) {
    e.preventDefault();
    const memberId = parseInt(document.getElementById("conMemberId").value);
    const amount = parseFloat(document.getElementById("conAmount").value);
    const reference = document.getElementById("conRef").value.toUpperCase();

    const { data, error } = await supabase
        .from('contributions')
        .insert([{ member_id: memberId, amount: amount, mpesa_reference: reference }]);

    if (error) alert("❌ Error: " + error.message);
    else { alert("💰 Payment added to ledger!"); document.getElementById("contributionForm").reset(); aggregateFinancialPoolFunds(); }
}

async function saveHarvestLog(e) {
    e.preventDefault();
    const memberId = parseInt(document.getElementById("agriMemId").value);
    const crop = document.getElementById("agriCrop").value;
    const yieldKg = parseFloat(document.getElementById("agriYield").value);

    const { data, error } = await supabase
        .from('agriculture_logs')
        .insert([{ member_id: memberId, crop_type: crop, harvest_yield_kg: yieldKg }]);

    if (error) alert("❌ Error: " + error.message);
    else { alert("🌽 Harvest data log saved!"); document.getElementById("agriForm").reset(); }
}

async function bookEquipmentRental(e) {
    e.preventDefault();
    const memberId = parseInt(document.getElementById("rentMemId").value);
    const machinery = document.getElementById("rentMachine").value;
    const startDate = document.getElementById("rentStart").value;
    const endDate = document.getElementById("rentEnd").value;
    const fee = parseFloat(document.getElementById("rentFee").value);

    const { data, error } = await supabase
        .from('equipment_rentals')
        .insert([{ member_id: memberId, machinery_name: machinery, rental_start_date: startDate, rental_end_date: endDate, total_fee: fee }]);

    if (error) alert("❌ Error: " + error.message);
    else { alert("🚜 Equipment booking confirmed!"); document.getElementById("rentalForm").reset(); }
}

// ==================== QUERIES (READ) ====================
async function loadInfrastructurePipelines() {
    const container = document.getElementById("projectContainer");
    const { data: projects, error } = await supabase.from('infrastructure_projects').select('*').order('id', { ascending: false });

    if (error) { container.innerHTML = `<p class="text-red-500 text-xs">Sync failed</p>`; return; }
    if (!projects || projects.length === 0) { container.innerHTML = `<p class="text-gray-400 text-xs italic">No active projects found.</p>`; return; }

    container.innerHTML = projects.map(p => `
        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center text-xs">
            <div>
                <h3 class="font-bold text-gray-700">${p.project_name}</h3>
                <p class="text-gray-500">Target: Ksh ${parseFloat(p.target_budget).toLocaleString()}</p>
            </div>
            <span class="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-amber-100 text-amber-800">${p.current_status}</span>
        </div>
    `).join('');
}

async function aggregateFinancialPoolFunds() {
    const { data: records, error } = await supabase.from('contributions').select('amount');
    if (error || !records) return;
    const aggregatedSum = records.reduce((total, tx) => total + parseFloat(tx.amount), 0);
    document.getElementById("totalPoolDisplay").innerText = `Ksh ${aggregatedSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}
