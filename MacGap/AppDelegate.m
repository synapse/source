//
//  AppDelegate.m
//  MG
//
//  Created by Tim Debo on 5/19/14.
//
//

#import "AppDelegate.h"
#import "WindowController.h"

@implementation AppDelegate

- (void)applicationWillFinishLaunching:(NSNotification *)aNotification
{
    // Insert code here to initialize your application
}

-(BOOL)applicationShouldHandleReopen:(NSApplication*)application
                   hasVisibleWindows:(BOOL)visibleWindows{
    if(!visibleWindows){
        [self.windowController.window makeKeyAndOrderFront: nil];
    }
    return YES;
}

- (void) applicationDidFinishLaunching:(NSNotification *)aNotification {

    #ifdef DEBUG
    NSLog(@"Debug");
    #else
    NSBundle *appBundle = [NSBundle mainBundle];
    NSString *appPath = [appBundle bundlePath];
    NSString *masReceiptPath = [[[appPath stringByAppendingPathComponent:@"Contents"] stringByAppendingPathComponent:@"_MASReceipt"] stringByAppendingPathComponent:@"receipt"];
    
    if (![[NSFileManager defaultManager] fileExistsAtPath:masReceiptPath]) {
        NSLog(@"173");
        exit(173);
    }
    #endif

    
    
    self.windowController = [[WindowController alloc] initWithURL: kStartPage];
    [self.windowController setWindowParams];
    [self.windowController close];
    //[self.windowController showWindow:self];
    [[NSUserNotificationCenter defaultUserNotificationCenter] setDelegate:self];
}

- (BOOL)userNotificationCenter:(NSUserNotificationCenter *)center
     shouldPresentNotification:(NSUserNotification *)notification
{
    return YES;
}

- (IBAction)newSnippet:(id)sender
{
    [self.windowController.webView stringByEvaluatingJavaScriptFromString:@"newSnippet();"];
}

- (IBAction)saveSnippet:(id)sender
{
    [self.windowController.webView stringByEvaluatingJavaScriptFromString:@"saveSnippet();"];
}

- (IBAction)closeSnippet:(id)sender
{
    [self.windowController.webView stringByEvaluatingJavaScriptFromString:@"closeSnippet();"];    
}

- (IBAction)deleteSnippet:(id)sender
{
    [self.windowController.webView stringByEvaluatingJavaScriptFromString:@"deleteSnippet();"];    
}

- (IBAction)newGroup:(id)sender
{
    [self.windowController.webView stringByEvaluatingJavaScriptFromString:@"newGroup();"];
}

- (IBAction)openPreferences:(id)sender
{
    [self.windowController.webView stringByEvaluatingJavaScriptFromString:@"openPreferences();"];
}

- (IBAction)searchSnippet:(id)sender
{
    [self.windowController.webView stringByEvaluatingJavaScriptFromString:@"toggleSearch();"];    
}

@end
