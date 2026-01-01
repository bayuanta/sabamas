
async function testBulkUpdate() {
    const API_URL = 'http://127.0.0.1:3001/api';

    // Helper for fetch
    const post = async (url, data, headers = {}) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`POST ${url} failed: ${res.status} ${text}`);
        }
        return res.json();
    };

    const get = async (url, headers = {}) => {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...headers }
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`GET ${url} failed: ${res.status} ${text}`);
        }
        return res.json();
    };

    // 1. Login to get token
    console.log('Logging in...');
    let token;
    try {
        const loginRes = await post(`${API_URL}/auth/login`, {
            email: 'admin@sabamas.com',
            password: 'admin'
        });
        token = loginRes.access_token;
        console.log('Login successful');
    } catch (e) {
        console.error('Login failed:', e.message);
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Get a customer
    console.log('Fetching customers...');
    let customer;
    try {
        const customersRes = await get(`${API_URL}/customers?limit=1`, headers);
        customer = customersRes.data[0];
        if (!customer) {
            console.log('No customers found to test');
            return;
        }
        console.log(`Selected customer: ${customer.nama} (${customer.id})`);
        console.log(`Current Tariff: ${customer.tarif_id}`);
    } catch (e) {
        console.error('Fetch customers failed:', e.message);
        return;
    }

    // 3. Get tariffs to switch to
    console.log('Fetching tariffs...');
    let newTariffId;
    try {
        const tariffsRes = await get(`${API_URL}/tariffs/categories`, headers);
        const tariffs = tariffsRes; // Array directly?
        // Pick a different tariff
        const otherTariff = tariffs.find(t => t.id !== customer.tarif_id);
        if (!otherTariff) {
            console.log('No other tariff found to switch to');
            return;
        }
        newTariffId = otherTariff.id;
        console.log(`Switching to Tariff: ${otherTariff.nama_kategori} (${newTariffId})`);
    } catch (e) {
        console.error('Fetch tariffs failed:', e.message);
        return;
    }

    // 4. Perform Bulk Update
    console.log('Performing Bulk Update...');
    const effectiveDate = new Date().toISOString().split('T')[0];
    try {
        const updateRes = await post(`${API_URL}/tariffs/bulk-update`, {
            customer_ids: [customer.id],
            tarif_id: newTariffId,
            tanggal_efektif: effectiveDate
        }, headers);
        console.log('Update response:', updateRes);
    } catch (e) {
        console.error('Bulk update failed:', e.message);
        return;
    }

    // 5. Verify Update
    console.log('Verifying update...');
    try {
        const checkRes = await get(`${API_URL}/customers/${customer.id}`, headers);
        const updatedCustomer = checkRes;

        if (updatedCustomer.tarif_id === newTariffId) {
            console.log('SUCCESS: Tariff updated correctly');
        } else {
            console.error('FAILURE: Tariff not updated');
            console.log('Expected:', newTariffId);
            console.log('Actual:', updatedCustomer.tarif_id);
        }

        // Check effective date
        const updatedDate = new Date(updatedCustomer.tanggal_efektif_tarif).toISOString().split('T')[0];
        if (updatedDate === effectiveDate) {
            console.log('SUCCESS: Effective date updated correctly');
        } else {
            console.error('FAILURE: Effective date not updated');
            console.log('Expected:', effectiveDate);
            console.log('Actual:', updatedDate);
        }

    } catch (e) {
        console.error('Verification failed:', e.message);
    }
}

testBulkUpdate();
