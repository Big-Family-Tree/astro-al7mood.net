using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using GeneGenie;
using GeneGenie.Gedcom;
using GeneGenie.Gedcom.Parser;
using System.Text;
using Newtonsoft.Json;

namespace CSharp_Shell{

    public class Program 
    {
    	private List<Indi> FlatIndi;
    	
    	private StringBuilder strng = new StringBuilder();
        public void Main() 
        {
           LoadGed();
        }
        private static int RefToId(string redid)
        {
        	var sid = redid.Replace("@","").Replace("P","").Replace("XREF","");
        	int id = 0;
        	int.TryParse(sid, out id);
        	return id;
        }
        private static List<Indi> FillRecursive(List<Indi> flatObjects, int parentId) { 
        	List<Indi> recursiveObjects = new List<Indi>(); 
        	foreach (var item in flatObjects.Where(x => x.ParentId.Equals(parentId)))
        	{ 
        		recursiveObjects.Add(
        			new Indi { 
        				Name = item.Name,
        				Id = item.Id,
        				Children = FillRecursive(flatObjects, item.Id),
        				Lastname = item.Lastname
        			});
        	}
        	return recursiveObjects;
        }
        private void DisplayNested(){
           foreach(var indi in FlatIndi)
           {
           		strng.AppendLine(indi.Id+","+indi.Name+","+indi.ParentId);
           }
        }
        private void LoadGed()
        {
        	var tree = GedcomRecordReader.CreateReader("ftree.ged");
        	Console.WriteLine(tree.Database.Families.Count);
        	Console.WriteLine(tree.Database.Individuals.Count);
        	FlatIndi = new List<Indi>();
        	foreach(var fam in tree.Database.Families)
        	{
        		
        		
        		var fatherid = 0;
        		
        		if(fam!= null)
        		{
        			var fatherref = fam.Husband;
        			
        			var father = (GedcomIndividualRecord)tree.Database.Individuals.FirstOrDefault(f => f.XrefId==fatherref);
        			
        			fatherid = RefToId(father.XRefID);
        			
        		}
        		var children = fam.Children;
        		foreach(var childref in children)
        		{
        		    var child = (GedcomIndividualRecord) tree.Database.Individuals.FirstOrDefault(f=> f.XrefId == childref);
        			FlatIndi.Add(
        				new Indi(
        					RefToId(child.XRefID),
        					child.GetName().Name.Replace(@"/","").Trim(),
        					fatherid
        		  	  )
        			);
        		}
        		
        	}
           
            var root = findRoot();
            var r = FillRecursive(FlatIndi, root.Id);
            root.Children = r;
            string json = JsonConvert.SerializeObject(root);
            File.WriteAllText("res.txt",json);
        	
        }
        private Indi findRoot()
        {
        	int i = 0;
            var indi = FlatIndi.Find(x => x.Name.Contains("راضي"));
            return indi;
        }
        
        public void test()
        {
        	var indis = new List<Indi>();
        	indis.Add(new Indi(1,"انس",2));
        	indis.Add(new Indi(2,"سالم",3));
        	indis.Add(new Indi(3,"حميان",0));
        	indis.Add(new Indi(4,"سليم",2));
        	indis.Add(new Indi(5,"mohamad",3));
        	indis.Add(new Indi(6,"turki",4));
        	var r = FillRecursive(indis,0);
        }
    }
}