

//default paremeters
var dlambda=1;
var daht=100;
var dm=100;
var daat=10000;
// view parameters
var myWidth=600;

var gamma=0.4;

var averageDialTime=12; //sec

var what2calcuate='1';
var dialingType='Predictive';
var averageHandlingTime=30; //sec
var clSize=10000;
var clTime=120; //min
var hitRatio=30; //%
var averageAbTime=3;
var maxAR=3;
var maxAWT=2; // sec
var countAWT=false;



var minSLp=80;
var slTime=20;
var maxASA=10;

var countSL=true;
var countAR=true;
var countASA=false;

var dtText ='<font color="red">'+dialingType+'</font> ';
var ahtText='<b><font color="red">'+averageHandlingTime+'</font></b> seconds';
var clsText='<b><font color="red">'+clSize+'</font></b> numbers';
var cltText='<b><font color="red">'+clTime+'</font></b> minutes';
var hrtText='<b><font color="red">'+hitRatio+'</font></b> %';
var aatText='<b><font color="red">'+averageAbTime+'</font></b> seconds';
var arText='<b><font color="red">'+maxAR+'</font></b> %';
var awtText='<b><font color="red">'+maxAWT+'</font></b> sec';
var noText='<b><font color="red">N/A</font></b>';

var slText='<b><font color="red">'+minSLp+'%</font></b> of calls in <b><font color="red">'+slTime+'</font></b> seconds';
var asaText='<b><font color="red">'+maxASA+'</font></b> seconds';


// for calculation summary
// var maxNumberCalls=0, maxNumberAgents=0, avServiceLevel=0, avAbRate=0,avASA=0,avAO=0;
// var	avServiceLevelN=0, avAbRateN=0,avASAN=0,avAON=0;

var hourNum=0;
var hours=19;
var firstHour=0;
var lastHour=hours+1;
var hourLines=[];
var gridIndex=0;
for (var i=1;i<=hours;i++) hourLines.push({hour:i});

var progressBar = Ext.create('Ext.ProgressBar', {
   renderTo: Ext.getBody(),
   width: 300
});

Ext.create('Ext.data.Store', {
    storeId:'hoursStore',
    fields:['hour','calls', 'agents', 'time', 'ar','asa','occupancy','gamma'],
    data:{'items':hourLines},
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'items'
        }
    }
});


var hoursGrid=Ext.create('Ext.grid.Panel', {	
    title: '<font style="font-size: 12px;">Results: Campaign Service Indicators</font>',
   // tools: [{type:"print"}],
    disabled:false,
    margin: "2 5 5 5",
    columnLines: true,
    cls: 'custom-dirty',
    viewConfig: { 
        stripeRows: false, 
        getRowClass:function(rec){return parseInt(rec.get('hour'))<lastHour && parseInt(rec.get('hour'))>=firstHour  ?'adult-row':'child-row';}  ,
    },
    store: Ext.data.StoreManager.lookup('hoursStore'),
    columns: [{  header: 'No.', cls:'biggertext1', dataIndex: 'hour', width: 35, sortable: false, tdCls: 'custom-column3'},         
                {
             	  header: 'Agents', cls:'biggertext1',dataIndex: 'agents', width:73,sortable:false,tooltip:'Staffing Level - Number of Agents',//tdCls: 'custom-column1',
                  editor: {
                     xtype: 'numberfield',
                     allowBlank: false,
                     minValue: 1,
                     maxValue: 600, },
                     tooltip:'Number of agents - an actual number of agents that will be required for running the campaign',
                  },  /*{ 
                  	header: 'List Size', cls:'biggertext1',dataIndex: 'calls', width:90, sortable: false, //tdCls: 'custom-column',
                    editor: { xtype: 'textfield', allowBlank: false },
                    tooltip:'List Size - an actual number of phone numbers called in this campaign',
                  },{  
                  	header: 'Actual Time', cls:'biggertext1',dataIndex: 'time', width:90, sortable: false, //tdCls: 'custom-column',
                    editor: { xtype: 'textfield', allowBlank: false },
                    tooltip:'Actual Time - an actual time interval (min) this campaign will last',
                  },     */        
                   {header: 'AR (%)', cls:'biggertext1',dataIndex: 'ar', width:60,sortable: false,tdCls: 'custom-column1',tooltip:'Abandonment Rate'},
                   {header: 'AWT (sec)', cls:'biggertext1',dataIndex: 'asa', width:70,sortable: false,tdCls: 'custom-column1',tooltip:'Average Speed of Answer'},
                   {header: 'Occupancy (%)', cls:'biggertext1',dataIndex: 'occupancy', width:110,sortable: false,tdCls: 'custom-column1',tooltip:'Agent Occupancy'},
    ],
    selType: 'cellmodel',
    plugins: [
        Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1
        })
    ],
   // viewConfig: {
    //    getRowClass:'price-fall'},
    height: 460,
    width: '100%', //420,
    listeners : {
                edit: function(editor,e,eOpts) {
                //	Ext.Msg.alert('Recalculation!','Started, indx='+e.colIdx);
                	if(e.colIdx==2){  // for column 2
                		if (parseInt(e.value)===0.0 || !parseInt(e.value)) { //if 0 calls +> all valuaes are set to 0
                			if(!parseInt(e.value) && parseInt(e.value)!=0) {Ext.Msg.alert('Warning!!!','Number of calls is not a number!');};
                			e.record.set('calls',0); e.record.set('agents',0);
                            e.record.set('sl',0); e.record.set('ar',0); 
                            e.record.set('asa',0); e.record.set('occupancy',0);
                            //avServiceLevelN++; avAbRateN++; avASAN++; avAON++;  
                        return;};
                        var calls=parseInt(e.value);
                        if(calls*averageHandlingTime/3600>=600){
                        	Ext.Msg.alert('Warning! It seems the number of agents is greater than 600','Ask BrightPattern professional service for help!');return;}
                       var parm={'calls':calls,'aht':averageHandlingTime,'slp':minSLp,'slt':slTime,'aat':averageAbTime,'asa':maxASA,'index':e.rowIdx};
                  
                       var result=calculate(parm);
                       e.record.set('calls',String(result.calls).slice(0,4));
                       e.record.set('agents',String(result.m).slice(0,4));
                       e.record.set('sl',String(result.sl).slice(0,4));
                       e.record.set('ar',String(result.ar).slice(0,4));
                       e.record.set('asa',String(result.asa).slice(0,4));
                       e.record.set('occupancy',String(result.ao).slice(0,4));
                       var rho=averageHandlingTime*result.calls/3600;
                       e.record.set('gamma',(result.m-rho)/Math.sqrt(rho));
                     }else if(e.colIdx==1){ // column 1: agents
                		if(!parseFloat(e.value)) {Ext.Msg.alert('Warning!','Number of agents is not a number!');return;};
                	/*	if(!parseFloat(e.record.get('calls'))) {
                			Ext.Msg.alert('Warning!','Number of calls is not specified!');
                			e.record.set('agents',''); return;}; */
                   		var nAgents=e.value;                	
                	    e.record.set('agents',nAgents);
                	    var la=clSize*hitRatio/(clTime*60*100);
                	    var apt=averageHandlingTime;
        	            if(dialingType!='Predictive') apt=averageDialTime+parseFloat(averageHandlingTime);
                	 //   Ext.Msg.alert('Recalculation!','Agents='+nAgents+', la='+la);
                	 //   var la=parseFloat(e.record.get('calls'))/3600;
                	    //alert("from agent, la="+la+', agents='+nAgents);
                        var result=simulate(nAgents,la,apt,averageAbTime,20);
                        //e.record.set('sl',String(result.sl).slice(0,4));
                        e.record.set('ar',String(result.ar).slice(0,4)); 
                        e.record.set('asa',String(result.asa).slice(0,4)); 
                        e.record.set('occupancy',String(result.ao).slice(0,4)); 
                      //  if(nAgents>maxNumberAgents) maxNumberAgents=nAgents; // for summary
                   }else{
                   	Ext.Msg.alert('Recalculation!','Error, indx='+e.colIdx);
                   }; 
                    //refreshSummary(summary);   
                 },
                 viewready:function(t,eOpt){t.getView().focusRow(20);},
            },
});

Ext.define('App.hourPanel',{
	extend: 'Ext.container.Container',
//	extend: 'Ext.form.Panel',
	id: 'hour_panel',
	frame:true,
	margin: "5 0 5 0",
    anchor: '100%',
    layout:'column',
    items:[{
                	xtype: 'displayfield',
            	    columnWidth:.1,
            	    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 20 0 10",
                    value:hourNum, 
                },{
                	xtype: 'textfield',
                	itemId:'arate',
            	    columnWidth:.18,
                    layout: 'anchor',
                    allowBlank:false,
                    labelWidth: 0,
                    margin: "0 0 0 0",
                    value:'' 
                },{
                	xtype: 'textfield',
            	    columnWidth:.15,
                    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 0 0 10",
                    value:'',
                    listeners : {
                         focus: function(thisp, eOptsp) { 
                         	alert("Click"+thisp.up("#hour_panel").down("#arate").getvalue());
                                 }
                     },
                },{
                	xtype: 'textfield',
            	    columnWidth:.2,
                    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 0 0 10",
                    value:''
                },{
                	xtype: 'textfield',
            	    columnWidth:.2,
                    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 0 0 10",
                    value:''
                },{
                	xtype: 'textfield',
            	    columnWidth:.15,
                    layout: 'anchor',
                    labelWidth: 0,
                    margin: "0 0 0 10",
                    value:''
                }
    ]
});

var calc_form2=Ext.create('Ext.form.Panel', {
	title:'<font style="font-size: 12px;">Input Parameters<font style="font-size: 14px;">',
	frame:true,
    width: 370,
    height: '100%',
    margin: "2 0 5 0",
    itemId:'form_panel2',
    resizable : true,
    fieldDefaults: {
        msgTarget: 'side',
        labelWidth: 190  },
    defaultType: 'textfield', 
    defaults: { anchor: '100%' },
    items:[{
    	xtype:'fieldset',
    	margin: "5 0 5 0",
       // title: 'Input Parameters',
        defaultType: 'displayfield',
        layout: 'anchor',
        defaults: { anchor: '100%'},
        items:[{
        	xtype:'fieldset',
            title: 'Campaign Parameters',
            defaultType: 'displayfield',
            layout: 'anchor',
            defaults: { anchor: '100%'},
            items:[{
            	labelCls: 'biggertext',
            	fieldCls:'biggertext',
        	    fieldLabel: 'Dialing Type',
                name: 'ddt',
                itemId:'ddt',
                id:'ddt',
                value: dtText,
            },{
            	labelCls: 'biggertext',
            	fieldCls:'biggertext',
        	    fieldLabel: 'Average Handling Time',
                name: 'aht',
                itemId:'aht',
                id:'aht',
                value: ahtText,
              },{
              	labelCls: 'biggertext',
            	fieldCls:'biggertext',
        	    fieldLabel: 'Calling List Size',
                name: 'cls',
                itemId:'cls',
                id:'cls',
                value: clsText,  
              },{
              	labelCls: 'biggertext',
            	fieldCls:'biggertext',
        	    fieldLabel: 'Campaign Lasting Time',
                name: 'clt',
                itemId:'clt',
                id:'clt',
                value: cltText,
              },{
              	labelCls: 'biggertext',
            	fieldCls:'biggertext',
        	    fieldLabel: 'Hit Ratio',
                name: 'hrt',
                itemId:'hrt',
                id:'hrt',
                value: hrtText,
              },
             ]
         },{
              	xtype:'fieldset',
            title: 'Call Abandonment',
            defaultType: 'displayfield',
            layout: 'anchor',
            
            defaults: { anchor: '100%'},
            items:[{
           	  fieldLabel:'Average Patience Time',
           	  itemId:'aat',
           	  labelCls: 'biggertext',
              fieldCls:'biggertext',
              value:aatText,
           },{
              fieldLabel:'Max Abandonment Rate',
              labelCls: 'biggertext',
              fieldCls:'biggertext',
           	  itemId:'ar',
              value:arText,
             }]
           },{
           	xtype:'fieldset',
            title: 'Average Waiting Time',
            //hidden:true,
            defaultType: 'displayfield',
            layout: 'anchor',
            defaults: { anchor: '100%'},
            items:[{
            	labelCls: 'biggertext',
              fieldCls:'biggertext',
             	fieldLabel:'Max Average Waiting Time',
             	itemId:'awt',             	
             	value:function(){if(countAWT){return awtText}else{return noText}}(),
           }]}
        ]
    }],
    buttons:[{
         text:'ShowChart',
         scale:'large',
         hidden:true,
         handler:function(){
         storeChart.loadData(aocc);
         winChart.show()
       }
    },{
    	      text:'DEBUG',scale:'large', hidden:true,
              handler:function(){Ext.Msg.alert('DEBUGGING','gamma='+gamma);}
    },{
    	//xtype : 'splitbutton',
    	text:"Start Calculation",
        scale:"large",
        handler:function(){
        	var apt=averageHandlingTime;
        	if(dialingType!='Predictive') apt=averageDialTime+parseFloat(averageHandlingTime);
        	//if(dialingType=='Predictive'){apt=averageHandlingTime;}else{apt=averageHandlingTime+averageDialTime;};
        	var m=Math.ceil(apt*clSize*hitRatio/(100*clTime*60));
        //	Ext.Msg.alert('DEBUGGING','apt='+apt+', m='+m+', adt='+averageDialTime);
        	var parm={'aht':apt,'clsize':clSize,'cltime':clTime,'hitratio':hitRatio,'aat':averageAbTime,'maxar':maxAR,'maxawt':maxAWT,'countawt':countAWT};
           var result=calculateOC(parm);
            var myrec=hoursGrid.store.getAt(gridIndex); gridIndex++;
            myrec.set('agents',result.m);
            myrec.set('time',clTime);
            myrec.set('calls',result.calls); 
            myrec.set('ar',String(result.ar).slice(0,4));
            myrec.set('asa',String(result.asa).slice(0,4));
            myrec.set('occupancy',String(result.ao).slice(0,4));
            var rho=hitRatio*apt*result.calls/(clTime*60*100);
            gamma=(result.m-rho)/Math.sqrt(rho);
                    
        }, /*
        menu: new Ext.menu.Menu({
               items: [
                  {text: 'Number of Agents', handler: function(){ 
                  	}},
                  {text: 'Time of Campaign', 
                   handler: function(){ 
		            	}
		          },
                  {text: 'List Size', handler: function(){ 
                  }}
               ]
            })  */
       },{
    	text:'Change Input Parameters',
    	scale:'large',
    	tooltip:'Change input parameters',
    	handler:function(){
    		change_win_form.show();
       	}
    },]
	
});

 //Ext.getCmp('aat').add();
 
 var hourCont=calc_form2.down('#resultsFset');
 //hourCount.add(hoursGrid);

Ext.onReady(function(){
	Ext.tip.QuickTipManager.init();
	var cooks=Ext.decode(Ext.util.Cookies.get('wfmcObj'));
	if(cooks!=null){
	  gamma=cooks.gamma;
      averageHandlingTime=cooks.aht;
      averageAbTime=cooks.aat;
    //  countSL=cooks.countSL;
    //  countAR=cooks.countAR;
      clTime=cooks.cltime;
      clSize=cooks.clsize;
      hitRatio=cooks.hitratio;
      countAWT=cooks.countawt;
      maxAR =cooks.ar;
   //   minSLp=cooks.slp;
   //   slTime=cooks.slt;
      maxASA=cooks.asa;
      ahtText='<b><font color="red">'+averageHandlingTime+'</font></b> seconds';
      if(countSL) {slText='<b><font color="red">'+minSLp+'%</font></b> of calls in <b><font color="red">'+slTime+'</font></b> seconds';}
                else{slText='<b><font color="red">N/A</font></b> of calls in <b><font color="red">N/A</font></b> sec';};
      if(countAR){aatText='<b><font color="red">'+averageAbTime+'</font></b> seconds';
                    arText='<b><font color="red">'+maxAR+'%</font></b>';}else{aatText=noText;arText=noText;};
      if(countASA){asaText='<b><font color="red">'+maxASA+'</font></b> seconds';}else{asaText=noText;};
      calc_form2.down('#aht').setValue(ahtText);
      calc_form2.down('#sl').setValue(slText);
      calc_form2.down('#aat').setValue(aatText);
      calc_form2.down('#ar').setValue(arText);
      calc_form2.down('#asa').setValue(asaText);
	}; //if
    var left=Ext.create('Ext.container.Container',{
	 	layout:{type:'fit'},
		items:[calc_form2]
	});   
	 
	var calc_tab=Ext.create('Ext.panel.Panel', {
		frame:true,
      width: 736, //1055,
      cls:'my-title',
      title:'<font style="font-size: 14px;">BrightPattern Outbound Workforce Calculator</font>',
      iconCls:'bp',
      tools: [{type:"help", handler:function(){ Ext.Msg.alert('About BrightPattern Outbound Workforce Calculator','Version 0.9'); }}],
   //    renderTo: document.body,
       renderTo:Ext.getBody(),
       headerCls:'biggertext',
        layout: 'hbox',
   //   renderTo: document.calc,
      items: [calc_form2,hoursGrid]
    });
    
});

var change_form=Ext.create('Ext.form.Panel', {
	frame:true,
    width: 330,
    //height: 500,
    itemId:'change_form',
    resizable : true,
    fieldDefaults: {
        msgTarget: 'side',
        labelWidth: 170  },
    defaultType: 'textfield',
    defaults: { anchor: '100%' },
    items:[{
    	xtype:'combobox',
    	fieldLabel: 'Calculate',
    	itemId:'w2c',
    	queryMode: 'local',
    	displayField: 'instance',
    	value: 'Number of agents',
    	store: new Ext.create('Ext.data.Store',{
                  	fields: ['code','instance'],
                  data: [{'code':"1",'instance':'Number of agents' //what2calcuate
                           },{
                            'code':"2",'instance':'Lasting tme'
                           },{
                            'code':"3",'instance':'Number of calls'
                           }]
        }),
        listeners: {
                  select:function(combo, records, eOpts){
                	       what2calcuate=records[0].data.code; }}, //1, 2 or 3
    }, {
            xtype:'combobox',
            //  	labelCls: 'biggertext',
            //	fieldCls:'biggertext',
        	fieldLabel: 'Dialing Type',
                itemId:'dlt',
                queryMode: 'local',
                displayField: 'instance',
                value: 'Predictive',
                store: new Ext.create('Ext.data.Store',{
                	fields: ['code','instance'],
                    data: [{'code':"1",'instance':'Predictive'
                           },{
                            'code':"2",'instance':'Progressive'
                           }]
                            }),
                listeners: {
                  select:function(combo, records, eOpts){
                	       var parm_name=records[0].data.code;
                	       if (parm_name=="1"){
                	       	this.up('#change_form').down('#adt').hide();
                	       }else if(parm_name=="2"){
                	       	this.up('#change_form').down('#adt').show();
                	       }else{};
                }},
              },{
        	fieldLabel: 'Average Dialing Time (sec)',
            name: 'adt',
            itemId:'adt',
            id:'adtt',
            allowBlank:false,
            hidden:true,
            value: averageDialTime,
           },     {
        	fieldLabel: 'Average Handling Time (sec)',
            name: 'caht',
            itemId:'caht',
            id:'caht',
            allowBlank:false,
            value: averageHandlingTime,
           },{
           	fieldLabel: 'Calling List Size (numbers)',
            name: 'ccls',
            itemId:'ccls',
            id:'ccls',
            allowBlank:false,
            value: clSize,
           },{
           	fieldLabel: 'Campaign Lasting Time (min)',
            name: 'cclt',
            itemId:'cclt',
            id:'cclt',
            allowBlank:false,
            value: clTime,
           },{
           	fieldLabel: 'Hit Ratio (%)',
            name: 'chrt',
            itemId:'chrt',
            id:'chrt',
            allowBlank:false,
            value: hitRatio,
           },{
           	xtype:'fieldset',
           // checkboxToggle:true,
            title: 'Call Abandonment',
            defaultType: 'textfield',
            //ccollapsed:function(){if(countAR){return false;}else{return true;}}(),
            layout: 'anchor',
            defaults: { anchor: '100%'},
            listeners : {
                expand: function(f,eOpts) {countAR=true; },
                collapse: function(f,eOpts) {countAR=false;}
            },
            items:[{
        	    fieldLabel: 'Average Patience Time (sec)',
                name: 'caat',
                itemId:'caat',
                id:'caat',
                allowBlank:false,
                value: averageAbTime,
              },{
        	    fieldLabel: 'Max Abandonment Rate (%)',
                name: 'car',
                itemId:'car',
                id:'car',
                allowBlank:false,
                value: maxAR,
              }]
           },{
            xtype:'fieldset',
            checkboxToggle:true,
            title: 'Account for Average Waiting Time?',
            defaultType: 'textfield',
            collapsed:function(){if(countAWT){return false;}else{return true;}}(),
            layout: 'anchor',
            defaults: { anchor: '100%'},
            listeners : {
                expand: function(f,eOpts) {countAWT=true; },
                collapse: function(f,eOpts) {countAWT=false;}
            },
            items:[{
        	   fieldLabel: 'Max Average Waiting Time (sec)',
        	   labelWidth: 200,
               name: 'cawt',
               itemId:'cawt',
               id:'cawt',
               allowBlank:false,
               value: maxAWT,
              }]
           }],
    buttons:[{
    	text:'Save',
    	handler:function(){
    		dialingType=this.up('#change_form').down('#dlt').getValue();
    		dtText='<font color="red">'+dialingType+'</font>';
    		calc_form2.down('#ddt').setValue(dtText);
    		// aht
    		averageHandlingTime=this.up('#change_form').down('#caht').getValue();
    		if(averageHandlingTime<=0){Ext.Msg.alert('Saving new parameters ','WARNING: Average handling time must be positive number!');return;};
    		ahtText='<b><font color="red">'+averageHandlingTime+'</font></b> seconds';
    		calc_form2.down('#aht').setValue(ahtText);
    		// caling list size
    		clSize=this.up('#change_form').down('#ccls').getValue();
    		if(clSize<=0){Ext.Msg.alert('Saving new parameters ','WARNING: Calling list size must be positive number');return;};
    		clsText='<b><font color="red">'+clSize+'</font></b> numbers';
    		calc_form2.down('#cls').setValue(clsText);  
    		// campaign lasting time
    		clTime=this.up('#change_form').down('#cclt').getValue();
    		if(clTime<=0){Ext.Msg.alert('Saving new parameters ','WARNING: Campaign lasting time must be positive number');return;};
    		cltText='<b><font color="red">'+clTime+'</font></b> minutes';
    		calc_form2.down('#clt').setValue(cltText);  
    		// hit ratio
    		hitRatio=this.up('#change_form').down('#chrt').getValue();
    		if(hitRatio<=0||hitRatio>100){Ext.Msg.alert('Saving new parameters ','WARNING: Hit ration must be positive number and not exceed 100%!');return;};
    		hrtText='<b><font color="red">'+hitRatio+'</font></b> %';
    		calc_form2.down('#hrt').setValue(hrtText); 
    		// abandonment
    		   averageAbTime=this.up('#change_form').down('#caat').getValue();
    		   if(averageAbTime<0){Ext.Msg.alert('Saving new parameters ','WARNING: Avarage abandonment time cannot be negative!');return;};
    		   aatText='<b><font color="red">'+averageAbTime+'</font></b> seconds';
               maxAR=this.up('#change_form').down('#car').getValue();
    		   if(maxAR<0||maxAR>=100){Ext.Msg.alert('Saving new parameters ','WARNING: Max abandonment rate cannot be negative or more than 100%!');return;};
    		   arText='<b><font color="red">'+maxAR+'</font></b> %';
    		   calc_form2.down('#ar').setValue(arText);
    		   calc_form2.down('#aat').setValue(aatText);
    		if(countAWT){
    			maxAWT=this.up('#change_form').down('#cawt').getValue();
    			if(maxAWT<=0){Ext.Msg.alert('Saving new parameters ','WARNING: Average waiting time must be positive number!');return;};
    		    awtText='<b><font color="red">'+maxAWT+'</font></b> seconds';    		  
    		  }else{
    		  	awtText=noText;
    		  };
    		  calc_form2.down('#awt').setValue(awtText);
    		  var parm={'aht':averageHandlingTime,'cltime':clTime,'clsize':clSize,'hitratio':hitRatio,'aat':averageAbTime,'maxawt':maxAWT,'ar':maxAR,'countawt':countAWT};
    		  Ext.util.Cookies.set('wfmcObj',Ext.encode(parm));
    		  change_win_form.hide();
    	}
    },{
    	text:'Close Window',
    	handler:function(){
    		change_win_form.hide();
    	},
    }]       
});
	
var change_win_form =  Ext.create('Ext.window.Window', {
                       title: 'Change Input Parameters',
                       itemId:'wf_panel',
                       resizable : true,
                       renderTo:Ext.getBody(),
                    //   renderTo:Ext.getBody(),
                    //   height: 400,
                    //   width: 400,
                    //   bodyStyle: 'background:#777; padding:10px;',
                       layout: 'fit',
                      // items: [],
                       items: [change_form],
});
  

