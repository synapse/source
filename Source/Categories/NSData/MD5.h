//
//  MD5.h
//  Safe
//
//  Created by Synapse on 11/18/12.
//
//

#import <Foundation/Foundation.h>
#import <CommonCrypto/CommonDigest.h>

@interface MD5 : NSObject {
    
}

+ (NSString *)MD5ForFile:(NSString *)pathToFile;
+ (NSString *)MD5ForData:(NSData *)fileData;

@end
