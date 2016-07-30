//
//  AppDelegate.h
//  MG
//
//  Created by Tim Debo on 5/19/14.
//
//

#import <Cocoa/Cocoa.h>

@class WindowController;

@interface AppDelegate : NSObject <NSApplicationDelegate,NSUserNotificationCenterDelegate> {
    
}

@property (retain, nonatomic) WindowController *windowController;

- (IBAction)newSnippet:(id)sender;
- (IBAction)saveSnippet:(id)sender;
- (IBAction)closeSnippet:(id)sender;
- (IBAction)deleteSnippet:(id)sender;
- (IBAction)newGroup:(id)sender;
- (IBAction)openPreferences:(id)sender;
- (IBAction)searchSnippet:(id)sender;

@end
