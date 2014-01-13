define(['bignumber', 'sha256'], function(BigNumber) {
  'use strict';
  angular.module('bc.bitcoin-address', []).service('BitcoinAddress', [function () {

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
    this.validate = function (address, address_type) {
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

    // prep position lookup table
    var vals = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    var positions = {};
    for (var i=0 ; i < vals.length ; ++i) {
      positions[vals[i]] = new BigNumber(i);
    }

    /// decode a base58 string payload into a hex representation
    function base58_decode(payload) {
      var base = new BigNumber(58);

      var length = payload.length;
      var num = new BigNumber(0);
      var leading_zero = 0;
      var seen_other = false;
      for (var i=0; i<length ; ++i) {
        var char = payload[i];
        var p = positions[char];

        // if we encounter an invalid character, decoding fails
        if (p === undefined) {
          throw new Error('invalid base58 string: ' + payload);
        }

        num = num.times(base).plus(p);

        if (char == '1' && !seen_other) {
          ++leading_zero;
        }
        else {
          seen_other = true;
        }
      }

      var hex = num.toString(16);

      // num.toString(16) does not have leading 0
      if (hex.length % 2 !== 0) {
        hex = '0' + hex;
      }

      while (leading_zero-- > 0) {
        hex = '00' + hex;
      }

      return hex;
    }

  }]);

  return this;
});