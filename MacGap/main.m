//
//  main.m
//  MG
//
//  Created by Tim Debo on 5/19/14.
//
//

#import <Cocoa/Cocoa.h>

int TVTValidateAndRunApplication(int argc, char *argv[]);

int main(int argc, char *argv[])
{
#ifdef DEBUG
    return NSApplicationMain(argc, (const char **)argv);
#else
    return TVTValidateAndRunApplication(argc, argv);
#endif
}

//int main(int argc, char *argv[])
//{
//    return NSApplicationMain(argc, (const char **)argv);
//}
