
var address_types = {
    prod: '00',
    testnet: '6f'
};

var p2sh_types = {
    prod: '05',
    testnet: 'c4'
};

/// check if a wallet address is valid
/// if address_type is supplied
/// also checks that the address matches that expected version
/// return {boolean} true if valid, false otherwise
function validate(address, address_type) {
    // default is to check that address is regular production address
    address_type = address_type || 'prod';

    try {
        var decoded_hex = base58_decode(address);
    } catch (e) {
        // if decoding fails, assume invalid address
        return false;
    }

    // make a usable buffer from the decoded data
    var decoded = decoded_hex;

    // should be 25 bytes per btc address spec
    if (decoded.length != 50) {
        return false;
    }

    var length = decoded.length;
    var cksum = decoded.slice(length - 8, length);
    var body = decoded.slice(0, length - 8);

    var good_cksum = sha256_digest(sha256_digest(CryptoJS.enc.Hex.parse(body))).toString().substr(0,8);

    if (cksum !== good_cksum) {
        return false;
    }

    // check that the address type is correct if requested
    if (address_type) {
        var type = decoded_hex.slice(0, 2);
        if (type !== address_types[address_type] &&
            type !== p2sh_types[address_type]) {
            return false;
        }
    }

    return true;
}

/// private methods

// helper to perform sha256 digest
function sha256_digest(payload) {
    return CryptoJS.SHA256(payload);
}



