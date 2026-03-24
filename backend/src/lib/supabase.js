const { createClient } = require("@supabase/supabase-js");
const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "issue-photos";

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
}

if (!/^https?:\/\//i.test(supabaseUrl)) {
    throw new Error(
        "Invalid SUPABASE_URL. Use your Supabase project URL (https://<project-ref>.supabase.co), not the Postgres database URL."
    );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function uploadTicketPhoto({ ticketId, file }) {
    const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
    const path = `tickets/${ticketId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) throw error;
    return path
}

async function createSignedPhotoUrl(path) {
    if (!path) return null;

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);

    if (error) throw error;
    return data.signedUrl;
}

module.exports = {
    supabase,
    bucket,
    uploadTicketPhoto,
    createSignedPhotoUrl
};
