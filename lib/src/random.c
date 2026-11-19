// SPDX-License-Identifier: LicenseRef-AGPL-3.0-only-OpenSSL

#include <chiaki/random.h>

#include <limits.h>

#ifdef CHIAKI_LIB_ENABLE_MBEDTLS
#include <mbedtls/ctr_drbg.h>
#include <mbedtls/entropy.h>
#else
#include <openssl/rand.h>
#endif

CHIAKI_EXPORT ChiakiErrorCode chiaki_random_bytes_crypt(uint8_t *buf, size_t buf_size)
{
	if(buf_size == 0)
		return CHIAKI_ERR_SUCCESS;
	if(!buf)
		return CHIAKI_ERR_INVALID_DATA;

#ifdef CHIAKI_LIB_ENABLE_MBEDTLS
	mbedtls_ctr_drbg_context ctr_drbg;
	mbedtls_entropy_context entropy;
	ChiakiErrorCode result = CHIAKI_ERR_UNKNOWN;

	mbedtls_ctr_drbg_init(&ctr_drbg);
	mbedtls_entropy_init(&entropy);

	// Seed a fresh DRBG for this request. Always release both contexts,
	// including when seeding or generation fails.
	mbedtls_ctr_drbg_set_prediction_resistance(&ctr_drbg, MBEDTLS_CTR_DRBG_PR_OFF);
	if(mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
			(const unsigned char *)"RANDOM_GEN", 10) == 0
			&& mbedtls_ctr_drbg_random(&ctr_drbg, buf, buf_size) == 0)
		result = CHIAKI_ERR_SUCCESS;

	mbedtls_ctr_drbg_free(&ctr_drbg);
	mbedtls_entropy_free(&entropy);
	return result;
#else
	// OpenSSL RAND_bytes takes an int length; reject values that would
	// overflow during conversion from size_t.
	if(buf_size > INT_MAX)
		return CHIAKI_ERR_OVERFLOW;

	return RAND_bytes(buf, (int)buf_size) == 1
		? CHIAKI_ERR_SUCCESS
		: CHIAKI_ERR_UNKNOWN;
#endif
}

CHIAKI_EXPORT uint32_t chiaki_random_32()
{
	uint32_t rand_number = 0;
	// Preserve a defined value if the cryptographic RNG reports failure.
	(void)chiaki_random_bytes_crypt((uint8_t *)&rand_number, sizeof(rand_number));
	return rand_number;
}
