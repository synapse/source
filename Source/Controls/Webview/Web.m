//
//  Web.m
//  Nimbus
//
//  Created by Synapse on 3/31/14.
//  Copyright (c) 2014 Twitter. All rights reserved.
//

#import "Web.h"

@implementation Web

@synthesize delegate;


- (id)initWithFrame:(NSRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        
    }
    return self;
}


- (void)drawRect:(NSRect)dirtyRect
{
    [super drawRect:dirtyRect];
    
    // Drawing code here.
}


-(void)keyDown:(NSEvent *)theEvent
{
    
}

-(void)keyUp:(NSEvent *)theEvent
{
    NSLog(@"Key %hu", theEvent.keyCode);
    
    switch (theEvent.keyCode) {
        default:
            break;
    }
    
    
}

@end



















