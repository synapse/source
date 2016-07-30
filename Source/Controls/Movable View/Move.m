//
//  Move.m
//  Source
//
//  Created by Synapse on 3/26/15.
//
//

#import "Move.h"

@implementation Move


//- (void)drawRect:(NSRect)rect
//{
//    // erase the background by drawing white
//    [[NSColor whiteColor] set];
//    [NSBezierPath fillRect:rect];
//    
//    // set the current color for the draggable item
//    [[NSColor clearColor] set];
//    
//    // draw the draggable item
//    [NSBezierPath fillRect:[self bounds]];
//}


- (void)drawRect:(NSRect)dirtyRect {
    [super drawRect:dirtyRect];
    
    // Drawing code here.
}

/*
- (NSView *)hitTest:(NSPoint)aPoint
{
    NSLog(@"Ht test %@", NSStringFromPoint(aPoint));
    
    // pass-through events that don't hit one of the visible subviews
    for (NSView *subView in [self subviews]) {
        if (![subView isHidden] && [subView hitTest:aPoint])
            return subView;
    }

    return nil;
}*/

-(void)mouseDown:(NSEvent *)theEvent {
    NSRect  windowFrame = [[self window] frame];
    
    initialLocation = [NSEvent mouseLocation];
    
    initialLocation.x -= windowFrame.origin.x;
    initialLocation.y -= windowFrame.origin.y;
}

- (void)mouseDragged:(NSEvent *)theEvent
{
    NSPoint currentLocation;
    NSPoint newOrigin;
    
    NSRect  screenFrame = [[NSScreen mainScreen] frame];
    NSRect  windowFrame = [self frame];
    
    currentLocation = [NSEvent mouseLocation];
    newOrigin.x = currentLocation.x - initialLocation.x;
    newOrigin.y = currentLocation.y - initialLocation.y;
    
    // Don't let window get dragged up under the menu bar
    if( (newOrigin.y+windowFrame.size.height) > (screenFrame.origin.y+screenFrame.size.height) ){
        newOrigin.y=screenFrame.origin.y + (screenFrame.size.height-windowFrame.size.height);
    }
    
    //go ahead and move the window to the new location
    //[self setFrameOrigin:newOrigin];
    [[self window] setFrameOrigin:newOrigin];
}

@end
