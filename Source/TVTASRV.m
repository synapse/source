//#import "TVTReceiptValidation.h"
// TVTReceiptValidation.h contains only one function declaration:
//     int TVTValidateAndRunApplication(int argc, char *argv[]);

#import <Foundation/Foundation.h>

#import <CommonCrypto/CommonDigest.h>
#import <Security/CMSDecoder.h>
#import <Security/SecAsn1Coder.h>
#import <Security/SecAsn1Templates.h>
#import <Security/SecRequirement.h>

#import <IOKit/IOKitLib.h>


static NSString *kTVTBundleID = @"com.cristianbarlutiu.source";
static NSString *kTVTBundleVersion = @"1.4.1";


typedef struct {
    size_t          length;
    unsigned char   *data;
} ASN1_Data;

typedef struct {
    ASN1_Data type;     // INTEGER
    ASN1_Data version;  // INTEGER
    ASN1_Data value;    // OCTET STRING
} TVTReceiptAttribute;

typedef struct {
    TVTReceiptAttribute **attrs;
} TVTReceiptPayload;

// ASN.1 receipt attribute template
static const SecAsn1Template kReceiptAttributeTemplate[] = {
    { SEC_ASN1_SEQUENCE, 0, NULL, sizeof(TVTReceiptAttribute) },
    { SEC_ASN1_INTEGER, offsetof(TVTReceiptAttribute, type), NULL, 0 },
    { SEC_ASN1_INTEGER, offsetof(TVTReceiptAttribute, version), NULL, 0 },
    { SEC_ASN1_OCTET_STRING, offsetof(TVTReceiptAttribute, value), NULL, 0 },
    { 0, 0, NULL, 0 }
};

// ASN.1 receipt template set
static const SecAsn1Template kSetOfReceiptAttributeTemplate[] = {
    { SEC_ASN1_SET_OF, 0, kReceiptAttributeTemplate, sizeof(TVTReceiptPayload) },
    { 0, 0, NULL, 0 }
};


enum {
    kTVTReceiptAttributeTypeBundleID                = 2,
    kTVTReceiptAttributeTypeApplicationVersion      = 3,
    kTVTReceiptAttributeTypeOpaqueValue             = 4,
    kTVTReceiptAttributeTypeSHA1Hash                = 5,
    kTVTReceiptAttributeTypeInAppPurchaseReceipt    = 17,
    
    kTVTReceiptAttributeTypeInAppQuantity               = 1701,
    kTVTReceiptAttributeTypeInAppProductID              = 1702,
    kTVTReceiptAttributeTypeInAppTransactionID          = 1703,
    kTVTReceiptAttributeTypeInAppPurchaseDate           = 1704,
    kTVTReceiptAttributeTypeInAppOriginalTransactionID  = 1705,
    kTVTReceiptAttributeTypeInAppOriginalPurchaseDate   = 1706,
};


static NSString *kTVTReceiptInfoKeyBundleID                     = @"Bundle ID";
static NSString *kTVTReceiptInfoKeyBundleIDData                 = @"Bundle ID Data";
static NSString *kTVTReceiptInfoKeyApplicationVersion           = @"Application Version";
static NSString *kTVTReceiptInfoKeyApplicationVersionData       = @"Application Version Data";
static NSString *kTVTReceiptInfoKeyOpaqueValue                  = @"Opaque Value";
static NSString *kTVTReceiptInfoKeySHA1Hash                     = @"SHA-1 Hash";
static NSString *kTVTReceiptInfoKeyInAppPurchaseReceipt         = @"In App Purchase Receipt";

static NSString *kTVTReceiptInfoKeyInAppProductID               = @"In App Product ID";
static NSString *kTVTReceiptInfoKeyInAppTransactionID           = @"In App Transaction ID";
static NSString *kTVTReceiptInfoKeyInAppOriginalTransactionID   = @"In App Original Transaction ID";
static NSString *kTVTReceiptInfoKeyInAppPurchaseDate            = @"In App Purchase Date";
static NSString *kTVTReceiptInfoKeyInAppOriginalPurchaseDate    = @"In App Original Purchase Date";
static NSString *kTVTReceiptInfoKeyInAppQuantity                = @"In App Quantity";


inline static void TVTCheckBundleIDAndVersion(void)
{
    NSDictionary *bundleInfo = [[NSBundle mainBundle] infoDictionary];
    
    NSString *bundleID = [bundleInfo valueForKey:@"CFBundleIdentifier"];
    if (![bundleID isEqualToString:kTVTBundleID]) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check bundle ID.", nil];
    }
    
    NSString *bundleVersion = [bundleInfo valueForKey:@"CFBundleShortVersionString"];
    if (![bundleVersion isEqualToString:kTVTBundleVersion]) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check bundle Version.", nil];
    }
}

inline static void TVTCheckBundleSignature(void)
{
    NSURL *bundleURL = [[NSBundle mainBundle] bundleURL];
    
    SecStaticCodeRef staticCode = NULL;
    OSStatus status = SecStaticCodeCreateWithPath((__bridge CFURLRef)bundleURL, kSecCSDefaultFlags, &staticCode);
    if (status != errSecSuccess) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to validate bundle signature: Create a static code", nil];
    }
    
    NSString *requirementText = @"anchor apple generic";   // For code signed by Apple
    
    SecRequirementRef requirement = NULL;
    status = SecRequirementCreateWithString((__bridge CFStringRef)requirementText, kSecCSDefaultFlags, &requirement);
    if (status != errSecSuccess) {
        if (staticCode) CFRelease(staticCode);
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to validate bundle signature: Create a requirement", nil];
    }
    
    status = SecStaticCodeCheckValidity(staticCode, kSecCSDefaultFlags, requirement);
    if (status != errSecSuccess) {
        if (staticCode) CFRelease(staticCode);
        if (requirement) CFRelease(requirement);
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to validate bundle signature: Check the static code validity", nil];
    }
    
    if (staticCode) CFRelease(staticCode);
    if (requirement) CFRelease(requirement);
}

inline static NSData *TVTGetReceiptData(void)
{
    NSURL *receiptURL = [[NSBundle mainBundle] appStoreReceiptURL];
    NSData *receiptData = [NSData dataWithContentsOfURL:receiptURL];
    if (!receiptData) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to fetch the MAS receipt.", nil];
    }
    return receiptData;
}

inline static NSData *TVTDecodeReceiptData(NSData *receiptData)
{
    CMSDecoderRef decoder = NULL;
    SecPolicyRef policyRef = NULL;
    SecTrustRef trustRef = NULL;
    
    @try {
        // Create a decoder
        OSStatus status = CMSDecoderCreate(&decoder);
        if (status) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to decode receipt data: Create a decoder", nil];
        }
        
        // Decrypt the message (1)
        status = CMSDecoderUpdateMessage(decoder, receiptData.bytes, receiptData.length);
        if (status) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to decode receipt data: Update message", nil];
        }
        
        // Decrypt the message (2)
        status = CMSDecoderFinalizeMessage(decoder);
        if (status) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to decode receipt data: Finalize message", nil];
        }
        
        // Get the decrypted content
        NSData *ret = nil;
        CFDataRef dataRef = NULL;
        status = CMSDecoderCopyContent(decoder, &dataRef);
        if (status) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to decode receipt data: Get decrypted content", nil];
        }
        ret = [NSData dataWithData:(__bridge NSData *)dataRef];
        CFRelease(dataRef);
        
        // Check the signature
        size_t numSigners;
        status = CMSDecoderGetNumSigners(decoder, &numSigners);
        if (status) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check receipt signature: Get singer count", nil];
        }
        if (numSigners == 0) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check receipt signature: No signer found", nil];
        }
        
        policyRef = SecPolicyCreateBasicX509();
        
        CMSSignerStatus signerStatus;
        OSStatus certVerifyResult;
        status = CMSDecoderCopySignerStatus(decoder, 0, policyRef, TRUE, &signerStatus, &trustRef, &certVerifyResult);
        if (status) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check receipt signature: Get signer status", nil];
        }
        if (signerStatus != kCMSSignerValid) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check receipt signature: No valid signer", nil];
        }
        
        return ret;
    } @catch (NSException *e) {
        @throw e;
    } @finally {
        if (policyRef) CFRelease(policyRef);
        if (trustRef) CFRelease(trustRef);
        if (decoder) CFRelease(decoder);
    }
}

inline static NSData *TVTGetASN1RawData(ASN1_Data asn1Data)
{
    return [NSData dataWithBytes:asn1Data.data length:asn1Data.length];
}

inline static int TVTGetIntValueFromASN1Data(const ASN1_Data *asn1Data)
{
    int ret = 0;
    for (int i = 0; i < asn1Data->length; i++) {
        ret = (ret << 8) | asn1Data->data[i];
    }
    return ret;
}

inline static NSNumber *TVTDecodeIntNumberFromASN1Data(SecAsn1CoderRef decoder, ASN1_Data srcData)
{
    ASN1_Data asn1Data;
    OSStatus status = SecAsn1Decode(decoder, srcData.data, srcData.length, kSecAsn1IntegerTemplate, &asn1Data);
    if (status) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to get receipt information: Decode integer value", nil];
    }
    return [NSNumber numberWithInt:TVTGetIntValueFromASN1Data(&asn1Data)];
}

inline static NSString *TVTDecodeUTF8StringFromASN1Data(SecAsn1CoderRef decoder, ASN1_Data srcData)
{
    ASN1_Data asn1Data;
    OSStatus status = SecAsn1Decode(decoder, srcData.data, srcData.length, kSecAsn1UTF8StringTemplate, &asn1Data);
    if (status) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to get receipt information: Decode UTF-8 string", nil];
    }
    return [[NSString alloc] initWithBytes:asn1Data.data length:asn1Data.length encoding:NSUTF8StringEncoding];
}

inline static NSDate *TVTDecodeDateFromASN1Data(SecAsn1CoderRef decoder, ASN1_Data srcData)
{
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"yyyy-MM-ddTHH:mm:ssZ"];
    
    ASN1_Data asn1Data;
    OSStatus status = SecAsn1Decode(decoder, srcData.data, srcData.length, kSecAsn1IA5StringTemplate, &asn1Data);
    if (status) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to get receipt information: Decode date (IA5 string)", nil];
    }
    
    NSString *dateStr = [[NSString alloc] initWithBytes:asn1Data.data length:asn1Data.length encoding:NSASCIIStringEncoding];
    return [dateFormatter dateFromString:dateStr];
}

inline static NSDictionary *TVTGetReceiptPayload(NSData *payloadData)
{
    SecAsn1CoderRef asn1Decoder = NULL;
    
    @try {
        NSMutableDictionary *ret = [NSMutableDictionary dictionary];
        
        // Create the ASN.1 parser
        OSStatus status = SecAsn1CoderCreate(&asn1Decoder);
        if (status) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to get receipt information: Create ASN.1 decoder", nil];
        }
        
        // Decode the receipt payload
        TVTReceiptPayload payload = { NULL };
        status = SecAsn1Decode(asn1Decoder, payloadData.bytes, payloadData.length, kSetOfReceiptAttributeTemplate, &payload);
        if (status) {
            [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to get receipt information: Decode payload", nil];
        }
        
        // Fetch all attributes
        TVTReceiptAttribute *anAttr;
        for (int i = 0; (anAttr = payload.attrs[i]); i++) {
            int type = TVTGetIntValueFromASN1Data(&anAttr->type);
            switch (type) {
                    // UTF-8 String
                case kTVTReceiptAttributeTypeBundleID:
                    [ret setValue:TVTDecodeUTF8StringFromASN1Data(asn1Decoder, anAttr->value) forKey:kTVTReceiptInfoKeyBundleID];
                    [ret setValue:TVTGetASN1RawData(anAttr->value) forKey:kTVTReceiptInfoKeyBundleIDData];
                    break;
                case kTVTReceiptAttributeTypeApplicationVersion:
                    [ret setValue:TVTDecodeUTF8StringFromASN1Data(asn1Decoder, anAttr->value) forKey:kTVTReceiptInfoKeyApplicationVersion];
                    [ret setValue:TVTGetASN1RawData(anAttr->value) forKey:kTVTReceiptInfoKeyApplicationVersionData];
                    break;
                case kTVTReceiptAttributeTypeInAppProductID:
                    [ret setValue:TVTDecodeUTF8StringFromASN1Data(asn1Decoder, anAttr->value) forKey:kTVTReceiptInfoKeyInAppProductID];
                    break;
                case kTVTReceiptAttributeTypeInAppTransactionID:
                    [ret setValue:TVTDecodeUTF8StringFromASN1Data(asn1Decoder, anAttr->value) forKey:kTVTReceiptInfoKeyInAppTransactionID];
                    break;
                case kTVTReceiptAttributeTypeInAppOriginalTransactionID:
                    [ret setValue:TVTDecodeUTF8StringFromASN1Data(asn1Decoder, anAttr->value) forKey:kTVTReceiptInfoKeyInAppOriginalTransactionID];
                    break;
                    
                    // Purchase Date (As IA5 String (almost identical to the ASCII String))
                case kTVTReceiptAttributeTypeInAppPurchaseDate:
                    [ret setValue:TVTDecodeDateFromASN1Data(asn1Decoder, anAttr->value) forKey:kTVTReceiptInfoKeyInAppPurchaseDate];
                    break;
                case kTVTReceiptAttributeTypeInAppOriginalPurchaseDate:
                    [ret setValue:TVTDecodeDateFromASN1Data(asn1Decoder, anAttr->value) forKey:kTVTReceiptInfoKeyInAppOriginalPurchaseDate];
                    break;
                    
                    // Quantity (Integer Value)
                case kTVTReceiptAttributeTypeInAppQuantity:
                    [ret setValue:TVTDecodeIntNumberFromASN1Data(asn1Decoder, anAttr->value)
                           forKey:kTVTReceiptInfoKeyInAppQuantity];
                    break;
                    
                    // Opaque Value (Octet Data)
                case kTVTReceiptAttributeTypeOpaqueValue:
                    [ret setValue:TVTGetASN1RawData(anAttr->value) forKey:kTVTReceiptInfoKeyOpaqueValue];
                    break;
                    
                    // SHA-1 Hash (Octet Data)
                case kTVTReceiptAttributeTypeSHA1Hash:
                    [ret setValue:TVTGetASN1RawData(anAttr->value) forKey:kTVTReceiptInfoKeySHA1Hash];
                    break;
                    
                    // In App Purchases Receipt
                case kTVTReceiptAttributeTypeInAppPurchaseReceipt: {
                    NSMutableArray *inAppPurchases = [ret valueForKey:kTVTReceiptInfoKeyInAppPurchaseReceipt];
                    if (!inAppPurchases) {
                        inAppPurchases = [NSMutableArray array];
                        [ret setValue:inAppPurchases forKey:kTVTReceiptInfoKeyInAppPurchaseReceipt];
                    }
                    NSData *inAppData = [NSData dataWithBytes:anAttr->value.data length:anAttr->value.length];
                    NSDictionary *inAppInfo = TVTGetReceiptPayload(inAppData);
                    [inAppPurchases addObject:inAppInfo];
                    break;
                }
                    
                    // Otherwise
                default:
                    break;
            }
        }
        return ret;
    } @catch (NSException *e) {
        @throw e;
    } @finally {
        if (asn1Decoder) SecAsn1CoderRelease(asn1Decoder);
    }
}

inline static NSData *TVTGetMacAddress(void)
{
    mach_port_t masterPort;
    kern_return_t result = IOMasterPort(MACH_PORT_NULL, &masterPort);
    if (result != KERN_SUCCESS) {
        return nil;
    }
    
    CFMutableDictionaryRef matchingDict = IOBSDNameMatching(masterPort, 0, "en0");
    if (!matchingDict) {
        return nil;
    }
    
    io_iterator_t iterator;
    result = IOServiceGetMatchingServices(masterPort, matchingDict, &iterator);
    if (result != KERN_SUCCESS) {
        return nil;
    }
    
    CFDataRef macAddressDataRef = nil;
    io_object_t aService;
    while ((aService = IOIteratorNext(iterator)) != 0) {
        io_object_t parentService;
        result = IORegistryEntryGetParentEntry(aService, kIOServicePlane, &parentService);
        if (result == KERN_SUCCESS) {
            if (macAddressDataRef) CFRelease(macAddressDataRef);
            macAddressDataRef = (CFDataRef)IORegistryEntryCreateCFProperty(parentService, (CFStringRef)@"IOMACAddress", kCFAllocatorDefault, 0);
            IOObjectRelease(parentService);
        }
        IOObjectRelease(aService);
    }
    IOObjectRelease(iterator);
    
    NSData *ret = nil;
    if (macAddressDataRef) {
        ret = [NSData dataWithData:(__bridge NSData *)macAddressDataRef];
        CFRelease(macAddressDataRef);
    }
    return ret;
}

inline static void TVTCheckReceiptIDAndVersion(NSDictionary *receiptInfo)
{
    NSString *bundleID = [receiptInfo valueForKey:kTVTReceiptInfoKeyBundleID];
    if (![bundleID isEqualToString:kTVTBundleID]) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check receipt ID.", nil];
    }
    
    NSString *bundleVersion = [receiptInfo objectForKey:kTVTReceiptInfoKeyApplicationVersion];
    if (![bundleVersion isEqualToString:kTVTBundleVersion]) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check receipt version.", nil];
    }
}

inline static void TVTCheckReceiptHash(NSDictionary *receiptInfo)
{
    NSData *macAddressData = TVTGetMacAddress();
    if (!macAddressData) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to get the primary MAC Address for checking receipt hash.", nil];
    }
    NSData *data1 = [receiptInfo valueForKey:kTVTReceiptInfoKeyOpaqueValue];
    NSData *data2 = [receiptInfo valueForKey:kTVTReceiptInfoKeyBundleIDData];
    
    NSMutableData *digestData = [NSMutableData dataWithData:macAddressData];
    [digestData appendData:data1];
    [digestData appendData:data2];
    
    unsigned char digestBuffer[CC_SHA1_DIGEST_LENGTH];
    CC_SHA1(digestData.bytes, (CC_LONG)digestData.length, digestBuffer);
    
    NSData *hashData = [receiptInfo valueForKey:kTVTReceiptInfoKeySHA1Hash];
    if (memcmp(digestBuffer, hashData.bytes, CC_SHA1_DIGEST_LENGTH) != 0) {
        [NSException raise:@"MAS Receipt Validation Error" format:@"Failed to check receipt hash.", nil];
    }
}

int TVTValidateAndRunApplication(int argc, char *argv[])
{
    @try {
        ///// Check the bundle information
        TVTCheckBundleIDAndVersion();
        TVTCheckBundleSignature();
        
        ///// Check the receipt information
        NSData *receiptData = TVTGetReceiptData();
        NSData *receiptDataDecoded = TVTDecodeReceiptData(receiptData);
        NSDictionary *receiptInfo = TVTGetReceiptPayload(receiptDataDecoded);
#if DEBUG
        NSLog(@"receiptInfo=%@", receiptInfo);
#endif
        
        TVTCheckReceiptIDAndVersion(receiptInfo);
        TVTCheckReceiptHash(receiptInfo);
        
        return NSApplicationMain(argc, (const char **)argv);
    } @catch (NSException *e) {
        NSLog(@"%@", e.reason);
        exit(173);
    }
}