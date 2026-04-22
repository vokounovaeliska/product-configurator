package cz.vokounova.configurator.users.application.configuration

import com.nimbusds.jose.JOSEObjectType
import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.MACSigner
import com.nimbusds.jose.crypto.MACVerifier
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import cz.vokounova.configurator.shared.exceptions.AuthErrorCode
import cz.vokounova.configurator.shared.exceptions.AuthException
import cz.vokounova.configurator.shared.jwt.JwtProperties
import cz.vokounova.configurator.shared.jwt.JwtService
import cz.vokounova.configurator.shared.jwt.JwtToken
import cz.vokounova.configurator.shared.jwt.JwtTokenId
import cz.vokounova.configurator.shared.utils.logger
import cz.vokounova.configurator.users.domain.UserId
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.time.OffsetDateTime
import java.util.*
import java.util.function.Supplier

@Component("UserJwtService")
class UserJwtService(
    private val jwtProperties: JwtProperties,
) : JwtService<UserId> {
    companion object {
        private val LOG by logger()
    }

    private val secretKey: ByteArray by lazy {
        jwtProperties.users.key.toByteArray().let {
            SecureRandom().nextBytes(it)
            it
        }
    }

    override fun generateAccessToken(
        auth: UserId,
        startDateSupplier: Supplier<OffsetDateTime>,
    ): JwtToken = generateToken(auth.value.toString(), jwtProperties.users.accessTokenExpirationInMinutes, startDateSupplier.get())

    override fun generateRefreshToken(
        auth: UserId,
        startDateSupplier: Supplier<OffsetDateTime>,
    ): JwtToken = generateToken(auth.value.toString(), jwtProperties.users.refreshTokenExpirationInMinutes, startDateSupplier.get())

    override fun getAuth(token: String): UserId = UserId(UUID.fromString(getClaims(token).subject))

    override fun getJwtId(token: String): JwtTokenId = JwtTokenId(UUID.fromString(getClaims(token).jwtid))

    override fun isExpired(token: String): Boolean =
        getClaims(token).expirationTime.before(
            Date.from(OffsetDateTime.now().toInstant()),
        )

    override fun isValid(
        token: String,
        auth: UserId,
    ): Boolean = auth.value.toString() == getClaims(token).subject && !isExpired(token)

    private fun generateToken(
        auth: String,
        expirationInMinutes: Long,
        startDateTime: OffsetDateTime,
    ): JwtToken {
        val signer = MACSigner(secretKey)
        val expiresAt = startDateTime.plusSeconds(expirationInMinutes * 60)
        val header =
            JWSHeader
                .Builder(JWSAlgorithm.HS256)
                .type(JOSEObjectType.JWT)
                .build()

        val claimsSet =
            JWTClaimsSet
                .Builder()
                .jwtID(UUID.randomUUID().toString())
                .subject(auth)
                .issuer("configurator-server")
                .issueTime(Date.from(startDateTime.toInstant()))
                .expirationTime(Date.from(expiresAt.toInstant()))
                .build()

        val signedJWT = SignedJWT(header, claimsSet)
        signedJWT.sign(signer)

        return JwtToken(
            token = signedJWT.serialize(),
            id = JwtTokenId(UUID.fromString(signedJWT.jwtClaimsSet.jwtid)),
            expiresAt = expiresAt,
        )
    }

    private fun getClaims(token: String): JWTClaimsSet {
        LOG.debug("Retrieving JWT Claims for token: $token")

        return try {
            val signedJWT = SignedJWT.parse(token)
            val verifier = MACVerifier(secretKey)

            signedJWT.verify(verifier)
            signedJWT.jwtClaimsSet
        } catch (e: Exception) {
            LOG.error("Exception occurred while verifying JWT token. Message: ${e.message}", e)
            throw AuthException(AuthErrorCode.INVALID_TOKEN)
        }
    }
}
