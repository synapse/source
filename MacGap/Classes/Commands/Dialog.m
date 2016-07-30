//
//  Dialog.m
//  MG
//
//  Created by Tim Debo on 5/27/14.
//
//

#import "Dialog.h"
#import "WindowController.h"

@implementation Dialog
@synthesize context;

- (void) openDialog:(JSValue *)args
{
    
    context = [JSContext currentContext];
        
    NSOpenPanel * openDlg = [NSOpenPanel openPanel];
    
    JSValue* mult = [args valueForProperty:@"multiple"];
    JSValue* files = [args valueForProperty:@"files"];
    JSValue* dirs = [args valueForProperty:@"directories"];
    JSValue* cb = [args valueForProperty: @"callback"];
    JSValue* allowedTypes = [args valueForProperty:@"allowedTypes"];
    [openDlg setCanChooseFiles: [files toBool]];
    [openDlg setCanChooseDirectories: [dirs toBool]];
    [openDlg setAllowsMultipleSelection: [mult toBool]];
    if(allowedTypes)
        [openDlg setAllowedFileTypes: [allowedTypes toArray]];
    [openDlg beginWithCompletionHandler:^(NSInteger result){
      
        if (result == NSFileHandlingPanelOKButton) {
            
            if(cb) {
                NSArray* files = [[openDlg URLs] valueForKey:@"relativePath"];
                [cb callWithArguments: @[files]];
            }
            
        }
    }];


}

- (void) saveDialog:(JSValue *)args
{
    context = [JSContext currentContext];
    NSSavePanel * saveDlg = [NSSavePanel savePanel];
    JSValue* title = [args valueForProperty:@"title"];
    JSValue* prompt = [args valueForProperty:@"prompt"];
    JSValue* message = [args valueForProperty:@"message"];
    JSValue* filename = [args valueForProperty:@"filename"];
    JSValue* directory = [args valueForProperty:@"directory"];
    JSValue* createDirs = [args valueForProperty:@"createDirs"];
    JSValue* allowedTypes = [args valueForProperty:@"allowedTypes"];
    JSValue* cb = [args valueForProperty: @"callback"];
    
    if(title)
        [saveDlg setTitle: [title toString]];
    
    if(prompt)
        [saveDlg setPrompt: [prompt toString]];

    
    if(message)
        [saveDlg setMessage: [message toString]];

    
    if(filename)
        [saveDlg setNameFieldStringValue: [filename toString]];

    if(directory)
        [saveDlg setDirectoryURL: [NSURL URLWithString: [directory toString]]];
    
    if(createDirs)
        [saveDlg setCanCreateDirectories: [createDirs toBool]];
    
    if(allowedTypes)
        [saveDlg setAllowedFileTypes: [allowedTypes toArray]];
    
    [saveDlg beginSheetModalForWindow: self.windowController.window completionHandler:^(NSInteger result){
        
        if (result == NSFileHandlingPanelOKButton) {
            
            if(cb) {
                NSDictionary* results = @{
                                          @"directory" : [[saveDlg directoryURL] valueForKey:@"relativePath"],
                                          @"filePath" : [[saveDlg URL] valueForKey:@"relativePath"],
                                          @"filename" : [saveDlg nameFieldStringValue]
                                          };
                
                [cb callWithArguments: @[results]];
            }
            
        }
    }];
    
}

- (void) alertDialog: (JSValue*)args
{
    context = [JSContext currentContext];
    JSValue *title = [args valueForProperty:@"title"];
    JSValue *message = [args valueForProperty:@"message"];
    JSValue *defaultButton = [args valueForProperty:@"defaultButton"];
    JSValue *alternateButton = [args valueForProperty:@"alternateButton"];
    JSValue *otherButton = [args valueForProperty:@"otherButton"];
    JSValue *alertStyle = [args valueForProperty:@"style"];
    JSValue *modal = [args valueForProperty:@"modal"];
    JSValue *cb = [args valueForProperty: @"callback"];
    
    NSString *defButton = [[defaultButton toString] isEqualToString:@"undefined"] ? @"OK" : [defaultButton toString];
    NSString *altButton = [[alternateButton toString] isEqualToString:@"undefined"] ? nil : [alternateButton toString];
    NSString *othButton = [[otherButton toString] isEqualToString:@"undefined"] ? nil : [otherButton toString];
    NSString *msg = [[message toString] isEqualToString:@"undefined"] ? @"" : [message toString];
    NSString *style = [alertStyle toString];
    
    NSAlert *alert = [NSAlert alertWithMessageText:[title toString]
                                     defaultButton:defButton
                                   alternateButton:altButton
                                       otherButton:othButton
                         informativeTextWithFormat:msg];
    
    if ([style isEqualToString:@"warning"]) {
        alert.alertStyle = 0;
    } else if ([style isEqualToString:@"info"]) {
        alert.alertStyle = 1;
    } else if ([style isEqualToString:@"error"]) {
        alert.alertStyle = 2;
    }
    
    if ([[defaultButton toString] isEqualToString:@"true"]) {
        [alert runModal];
        return;
    }
    
    
    [alert beginSheetModalForWindow: self.windowController.window completionHandler:^(NSInteger result){
        if(cb){
            NSDictionary* results = @{
                                      @"return" : [NSNumber numberWithInteger:result]
                                      };
            
            [cb callWithArguments: @[results]];
        }
    }];
}

- (void) promptDialog: (JSValue*)args
{
    context = [JSContext currentContext];
    JSValue *title = [args valueForProperty:@"title"];
    JSValue *message = [args valueForProperty:@"message"];
    JSValue *defaultButton = [args valueForProperty:@"defaultButton"];
    JSValue *alternateButton = [args valueForProperty:@"alternateButton"];
    JSValue *defaultValue = [args valueForProperty:@"default"];
    JSValue *placeholder = [args valueForProperty:@"placeholder"];
    JSValue* cb = [args valueForProperty: @"callback"];
    
    NSString *defButton = [[defaultButton toString] isEqualToString:@"undefined"] ? @"OK" : [defaultButton toString];
    NSString *altButton = [[alternateButton toString] isEqualToString:@"undefined"] ? nil : [alternateButton toString];
    NSString *msg = [[message toString] isEqualToString:@"undefined"] ? @"" : [message toString];

    
    NSAlert *alert = [NSAlert alertWithMessageText:[title toString]
                                     defaultButton:defButton
                                   alternateButton:altButton
                                       otherButton:nil
                         informativeTextWithFormat:msg];
    
    NSTextField *input = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 0, 295, 24)];
    
    [[input cell] setFocusRingType:NSFocusRingTypeNone];
    
    if (![[defaultValue toString] isEqualToString:@"undefined"]) {
        [input setStringValue:[defaultValue toString]];
    }
    
    if (![[placeholder toString] isEqualToString:@"undefined"]) {
        [[input cell] setPlaceholderString:[placeholder toString]];
    }
    
    [alert setAccessoryView:input];
    
    
    [alert beginSheetModalForWindow: self.windowController.window completionHandler:^(NSInteger result){
        if (result == NSFileHandlingPanelOKButton) {
            if(cb){
                NSDictionary* results = @{
                                          @"value": [input stringValue]
                                          };
                
                [cb callWithArguments: @[results]];
            }
        }
    }];
}

- (void) exportDialog: (JSValue*)args
{
    context = [JSContext currentContext];
    NSSavePanel * saveDlg = [NSSavePanel savePanel];
    JSValue* title = [args valueForProperty:@"title"];
    JSValue* prompt = [args valueForProperty:@"prompt"];
    JSValue* message = [args valueForProperty:@"message"];
    JSValue* filename = [args valueForProperty:@"filename"];
    JSValue* directory = [args valueForProperty:@"directory"];
    JSValue* createDirs = [args valueForProperty:@"createDirs"];
    JSValue* allowedTypes = [args valueForProperty:@"allowedTypes"];
    JSValue* data = [args valueForProperty:@"data"];
    JSValue* cb = [args valueForProperty: @"callback"];
    
    if(title)
        [saveDlg setTitle: [title toString]];
    
    if(prompt)
        [saveDlg setPrompt: [prompt toString]];
    
    
    if(message)
        [saveDlg setMessage: [message toString]];
    
    
    if(filename)
        [saveDlg setNameFieldStringValue: [filename toString]];
    
    if(directory)
        [saveDlg setDirectoryURL: [NSURL URLWithString: [directory toString]]];
    
    if(createDirs)
        [saveDlg setCanCreateDirectories: [createDirs toBool]];
    
    if(allowedTypes)
        [saveDlg setAllowedFileTypes: [allowedTypes toArray]];
    
    [saveDlg beginSheetModalForWindow: self.windowController.window completionHandler:^(NSInteger result){
        if (result == NSFileHandlingPanelOKButton) {
            
            NSError *error = nil;
            [[data toString] writeToFile:[[saveDlg URL] path]
                                   atomically:YES
                                     encoding:NSUTF8StringEncoding
                                        error:nil];
            
            if (error) {
                [NSApp presentError:error];
            } else {
                if(cb) {
                    NSDictionary* results = @{
                                              @"directory" : [[saveDlg directoryURL] valueForKey:@"relativePath"],
                                              @"filePath" : [[saveDlg URL] valueForKey:@"relativePath"],
                                              @"filename" : [saveDlg nameFieldStringValue],
                                              @"path" : [[saveDlg URL] path]
                                              };
                    
                    [cb callWithArguments: @[results]];
                }
            }
        }
    }];
}

@end
