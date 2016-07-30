#include "html.h"

#define UNCOMPRESSED_HTML [[NSString alloc] initWithData:[NSData dataFromBase64String:HTML] encoding:NSUTF8StringEncoding]
/*
#define UNCOMPRESSED_CSS [[NSString alloc] initWithData:[NSData dataFromBase64String:CSS] encoding:NSUTF8StringEncoding]
#define UNCOMPRESSED_BOO [[NSString alloc] initWithData:[NSData dataFromBase64String:BOOTSTRAP] encoding:NSUTF8StringEncoding]
#define UNCOMPRESSED_APP [[NSString alloc] initWithData:[NSData dataFromBase64String:APP] encoding:NSUTF8StringEncoding]

#define COMBINED_WITH_CSS [UNCOMPRESSED_HTML stringByReplacingOccurrencesOfString:@"<!--STYLE-->" withString:UNCOMPRESSED_CSS]
#define COMBINED_APP [COMBINED_WITH_CSS stringByReplacingOccurrencesOfString:@"<!--APP-->" withString:UNCOMPRESSED_APP]
#define COMBINED_BOO [COMBINED_APP stringByReplacingOccurrencesOfString:@"<!--BOOTSTRAP-->" withString:UNCOMPRESSED_BOO]

#define INDEX_PAGE [NSString stringWithFormat:@"%@", COMBINED_BOO]
*/