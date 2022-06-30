
export type QrMember = {
    hash?: string,
    username?: string,
    permission_code?: string,
    email?: string,
    pass_hash?: string,
    joined_at?: Date
}

export type QrCode = {
    hash?: string,
    data_qr?: string,
    key_qr?: string,
    owner_hash?: string,
    created_at?: Date
}