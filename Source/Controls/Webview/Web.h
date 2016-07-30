//
//  Web.h
//  Nimbus
//
//  Created by Synapse on 3/31/14.
//  Copyright (c) 2014 Twitter. All rights reserved.
//

#import <WebKit/WebKit.h>

// am facut subclasa asta sa pot une un custom delegate sa am handler la drag and drop

@interface Web : WebView {
    
    id delegate;
    NSPoint initialLocation;
    
}

@property (nonatomic, retain) id delegate;

@end
