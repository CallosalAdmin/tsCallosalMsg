// import { stringify } from "querystring";
// import { isUndefined } from "util";
// import config from "./config";
// import { createBrotliDecompress } from "zlib";
// import * as Presentation from './CallosalPres';
// const Zet = require('zet');
import * as Zet from 'https://github.com/CallosalAdmin/tsCallosalMsg/blob/main/zet2.ts';

// Setup a Date format standard
Object.defineProperty(Date.prototype, 'YYYYMMDDHHMMSS', {
  value: function() {
      function pad2(n:number) {  // always returns a string
          return (n < 10 ? '0' : '') + n;
      }
      return this.getFullYear() +
             pad2(this.getMonth() + 1) + 
             pad2(this.getDate()) +
             pad2(this.getHours()) +
             pad2(this.getMinutes()) +
             pad2(this.getSeconds());
  }
});

export const enum eMsgSeparators {
  grpSep = '\x1D',      // Section Separator
  tagSep = '\x1E',      // Tag Separator
  CompTagSep = '_:_',   // Tag Value Separator 
  tagExtStart = '_:',   // Tag Extension Section Start
  tagExtDimStart = '[', // Tag Extension Dimension Start
  tagExtDimSep = '|',   // Tag Extension Dimension Separator
  tagExtDimEnd = ']',   // Tag Extension Dimension End
  tagExtAttStart = '{', // Tag Extension Attribute Start
  tagExtAttSep = '|',   // Tag Extension Attribute Separator
  tagExtAttEnd = '}',   // Tag Extension Attribute End
  tagExtEnd = ':_',     // Tag Extension Section End
}

export const enum eAction {
  none = '',
  push = 'push',
  query = 'query',
  find = 'find',
  // Custom commands
  refresh = 'refresh',
}

export const enum ePayloadType {
  text = 0,
  binary = 1,
  JSON = 2,
}

export interface calSections {
  Extension: string,
  Defaults: string,
  Source: string,
  StartTime: string,
  EndTime: string,
  Tags: string,
  PayloadType: string,
  UqRI: string,
  Destination: string,
  Payload: any,
};

export class Extension {
  private _dimensions: Array<any> | undefined;
  private _attributes: Array<any> | undefined;
  constructor(...args: any) {
    args.forEach((arg: any) => {
      this.setDimension(arg);
    });
  } // constructor
  public addDimension = (...args: any) => {
    // values.forEach((value:any) => {
    //   this.setDimension(value, 0);
    // });
    const lvNewDim = new Extension();
    args.forEach((arg: any) => {
      this.setDimension(arg, 0);
    });
  }
  public addAttribute = (value: any) => {
    this.setAttribute(value, 0);
  }
  public setDimension = (value: any, idx: number = 0) => {
    if (!this._dimensions) this._dimensions = new Array<any>();
    if (idx === 0) {
      idx = this._dimensions.length;
    }
    this._dimensions[idx] = value;
  }
  public setAttribute = (value: any, idx: number = 0) => {
    if (!this._attributes) this._attributes = new Array<any>();
    if (idx === 0) {
      idx = this._attributes.length;
    }
    this._attributes[idx] = value;
  }
  public toString = (): string => {
    let lvDimString = '';
    let lvAttString = '';
    if (this._attributes && this._attributes.length > 0) {
      this._attributes.forEach((dim: any) => {
        if (lvAttString.length === 0) {
          lvAttString = eMsgSeparators.tagExtAttStart;
        } else {
          lvAttString += eMsgSeparators.tagExtAttSep;
        }
        switch (typeof(dim)){
          case 'object':
            if (dim instanceof Date) {
              const lvDate: Date = dim;
              lvAttString += lvDate['YYYYMMDDHHMMSS'].call();
            } else {
              lvAttString += dim.toString();
            }
            break; 
          default:
            lvAttString += dim.toString();
            break;
        }
      });
    }
    if (lvAttString.length !== 0) {
      lvAttString += eMsgSeparators.tagExtAttEnd;
    }
    if (this._dimensions && this._dimensions.length > 0) {
      this._dimensions.forEach((dim: any) => {
        if (lvDimString.length === 0) {
          lvDimString = eMsgSeparators.tagExtDimStart;
        } else {
          lvDimString += eMsgSeparators.tagExtDimSep;
        }
        lvDimString += dim.toString();
      });
    }
    if (lvDimString.length !== 0) {
      lvDimString += eMsgSeparators.tagExtDimEnd;
    }
    return lvAttString + lvDimString;
  }
  public get attributes(): Array<any> {
    if (!this._attributes) this._attributes = new Array<any>(); 
    return this._attributes;
  }
  public get dimensions(): Array<any> {
    if (!this._dimensions) this._dimensions = new Array<any>(); 
    return this._dimensions;
  }
}

export class Extensions {
  private _extensions: Array<Extension> = new Array<Extension>();
  public get = (): Array<Extension> => {
    return this._extensions;
  }
  public addExtension = (pNewExt: Extension):void => {
    this._extensions.push(pNewExt);
  }
  public toString():string {
    let lvString = '';
    this._extensions.forEach((ext: Extension) => {
      lvString += ext.toString();
    });
    return lvString;
  }
}

export abstract class clTag {
  abstract get name(): string;
  abstract toString(): string;
  public extensions: Extensions = new Extensions();
  public contains = (pTag: clTag, bIgnoreExts?: boolean): boolean => {  // Completely encapsulates
    if (this.name !== pTag.name) {
      return false;
    }
    let ltHostExts = this.extensions.get();
    let lGuestExts = pTag.extensions.get();
    if (ltHostExts.length < lGuestExts.length) {
      return false; // If the guest has more attributes than the Host, then it impossible for the host set to contain the guest set
    }
    if (lGuestExts.length === 0) {
      return true; // If the guest has no extensions, then asume none
    }
    // Attributes
    let arrHost = <any>[];
    let arrGuest = <any>[];
    ltHostExts.forEach((ext: Extension) => {
      const lvAttribs = ext.attributes;
      if (lvAttribs) {
        lvAttribs.forEach(attrib => {
          arrHost.push(attrib);
        });
      }
    });
    lGuestExts.forEach((ext: Extension) => {
      const lvAttribs = ext.attributes;
      if (lvAttribs) {
        lvAttribs.forEach(attrib => {
          arrGuest.push(attrib);
        });
      }
    });
    // let setHost = new Zet(arrHost);
    // let setGuest = new Zet(arrGuest);
    // if (!setGuest.subset(setHost)) {
    //   return false;
    // }
    // Dimensions
    arrHost = new Array<any>();
    arrGuest = new Array<any>();
    ltHostExts.forEach((ext: Extension) => {
      const lvDims = ext.dimensions;
      const ltSubDim = new Array<any>();;
      if (lvDims) {
        lvDims.forEach(dim => {
          ltSubDim.push(dim);
        });
      }
      arrHost.push(ltSubDim);
    });
    lGuestExts.forEach((ext: Extension) => {
      const lvDims = ext.dimensions;
      const ltSubDim = new Array<any>();;
      if (lvDims) {
        lvDims.forEach(dim => {
          ltSubDim.push(dim);
        });
      }
      arrGuest.push(ltSubDim);
    });
    for (let k = 0; k < arrGuest.length; k++) {
      const GuestSubDim: Array<any> = arrGuest[k];
      const HostSubDim: Array<any> = arrHost[k];
      if (GuestSubDim.length != HostSubDim.length) {
        return false; // If guest dimensions do not match the host, they cannot be compared
      }
      switch (<number>GuestSubDim.length) {
        case 1: // Single dimension - simple comparison
          if (GuestSubDim[0] != HostSubDim[0]) {
            return false;
          }
          break; 
        case 2:  // Linear dimension
          if (GuestSubDim[0] >= HostSubDim[0] && GuestSubDim[1] <= HostSubDim[1]) {
          } else {
            return false;
          }
          break;
        default:
          throw new Error('Dimensions beyond 2 not catered for yet');
      }
    }
    return true;
  }
  public overlaps = (pTag: clTag, bIgnoreExts?: boolean): boolean => {   // Overlaps
    throw new Error('Method not implemented yet');
  }
}

/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/* Simple TAG 
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
export class Tag extends clTag {
  public readonly name: string;
  // private _extensions: Array<Extension> | undefined;
  constructor(tagIn: string);
  constructor(tagIn: string, pDim1: any, pDim2: any);
  constructor(tagIn: string, pAttrib: any);
  constructor(tagIn: string, p1?: any | null, p2?: any | null) {
    super();
    this.name = '*NotNamedYet*';
    if (tagIn) this.name = tagIn;
    if (p2!==null && p1!==null) {
      // Assume DIMENSION
      const lvExt1 = new Extension();
      if (p1<=p2) { 
        lvExt1.addDimension(p1);
        lvExt1.addDimension(p2);
      } else {
        lvExt1.addDimension(p2);
        lvExt1.addDimension(p1);
      }
      this.extensions.addExtension(lvExt1);
    } else if (p1!==null) {
      // Assume ATTRIBUTE
      const lvAttrib1 = new Extension();
      lvAttrib1.addAttribute(p1);
      this.extensions.addExtension(lvAttrib1);
    }
  } // constructor
  public toString = (): string => {
    let lvString: string = this.name;
    if (this.extensions) {
      let lvExtensions = this.extensions.toString();
      if (lvExtensions.length>0){
        lvString += eMsgSeparators.tagExtStart + lvExtensions + eMsgSeparators.tagExtEnd;
      }
    }
    return lvString;
  };
  // public extensions(): Array<Extension> {
  //   if (!this._extensions) this._extensions = new Array<Extension>();
  //   return this._extensions;
  // }
  public addDimension = (...args: any[]): void => {
    const lvNewDim = new Extension();
    args.forEach((arg) => {
      lvNewDim.addDimension(arg);
    });
    this.extensions.addExtension(lvNewDim);
  }
  public addAttribute = (...args: any[]): void => {
    args.forEach((arg) => {
      const lvNewAttrib = new Extension();
      lvNewAttrib.addAttribute(arg);
      this.extensions.addExtension(lvNewAttrib);
    });
  }
} // Tag

/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
/* COMPOUND TAG 
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
export class CompoundTag extends clTag {
  private _tags: Array<clTag> | undefined;
  toString(): string {
    let lvString = this.name;
    const ltExts = this.extensions.get();
    if (ltExts && ltExts.length > 0) {
      lvString += eMsgSeparators.tagExtStart;
      ltExts.forEach((ext: Extension) => {
        lvString += ext.toString();
      });
      lvString += eMsgSeparators.tagExtEnd;
    }
    return lvString;
  }
  // extensions(): Extension[] {
  //   let ltExts = new Array<Extension>();
  //   this.tags.forEach((tag: clTag) => {
  //     const ltSubExts = tag.extensions();
  //     ltSubExts.forEach((lvExt) => {
  //       ltExts.push(lvExt);
  //     });
  //   });
  //   return ltExts;
  // }
  constructor(...args: (clTag | string)[]) {
    super();
    args.forEach((arg: clTag | string) => {
      let lvNewTag: Tag;
      if (typeof (arg) === 'string') {
        lvNewTag = new Tag(arg);
      } else if (arg instanceof Tag) {
        lvNewTag = arg;
      } else {
        return; // Skip argument!
      }
      if (lvNewTag) {
        this.tags.push(lvNewTag);
      }
    });
  }
  public get tags(): Array<clTag> {
    if (!this._tags) this._tags = new Array<clTag>();
    return this._tags;
  }
  public get name(): string {
    let lvName = '';
    if (this._tags) {
      this._tags.forEach((tag: clTag) => {
        if (lvName.length > 0) {
          lvName += eMsgSeparators.CompTagSep;
        }
        lvName += tag.name;
      });
    }
    return lvName;
  };
}

export class TagSet {
  private _tags = new Array<clTag>();
  constructor() {
    // this._tags.push(new Tag('Initial Tag'));
  }
  public toString = (): string => {
    if (!this._tags) return '(no tags set)';
    if (this._tags.length == 0) return '(tags list is empty)';
    let lv_tag_string = '';
    this._tags.forEach(tag => {
      if (lv_tag_string.length != 0) {
        lv_tag_string += eMsgSeparators.tagSep;
      }
      lv_tag_string += tag.toString();
    });
    return lv_tag_string;
  } // toString
  public findTag = (pTagName:string): clTag|undefined => {
    if (pTagName.length>0){
      let lResult = this._tags.find((e) => { return e.name === pTagName; });
      return lResult;
    }
    return undefined;
  };
  // Add a new Tag
  public setTag(pTag: clTag): clTag {
    let lResult = this.findTag(pTag.name);
    if (lResult) {
      return lResult;
    } else {
      this._tags.push(pTag);
      return pTag;
    }
  } // addTag
  public getTags = (): clTag[] => {
    return this._tags;
  }
  public contains = (pTagIn: clTag): boolean => {
    this._tags.forEach(tag => {
      if (tag.name === pTagIn.name) {
        // TODO - evaluate extensions & subsets
        return true;
      }
    });
    return false;
  }

}

/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
class Source extends TagSet {
  /*---------------------------------------------------------------------------------*/
  /*---------------------------------------------------------------------------------*/
  // private _origin: string|undefined;
  private _flags: Map<string, boolean> = new Map();
  constructor() {
    super();
  } // constructor
  public setOrigin = (pOrigin:string): void => {
    // this._origin = pOrigin;
    this.setTag(new Tag('origin',pOrigin));
  } // setOrigin
  public getOrigin = (): string => {
    let lOrigin = this.findTag('origin');
    if (lOrigin) {
      let lExtensions = lOrigin.extensions.get();
      if (lExtensions && lExtensions.length>0){
        let lAttributes = lExtensions[0].attributes;
        if (lAttributes && lAttributes.length>0) {
          let lvOrigin = lAttributes[0];
          return lvOrigin;
        }
      }
    }
    return ''; // none set
  } // getOrigin
  public toString = (): string => {
    let lvSource = '';
    lvSource = this.getOrigin();
    this.getFlags().forEach((LvActive, LvKey) => {
      if (!LvActive) return null;
      if (lvSource.length !== 0) { lvSource += ',' };
      lvSource += LvKey;
    });
    return lvSource;
  } // toString
  public getFlags = (): Map<string, boolean> => {
    return this._flags;
  }
  public setFlag = (pFlag: string, pValue: boolean): void => {
    if (pFlag === 'ALL') {
      this._flags.forEach(flag => {
        flag = pValue;
      });
    } else {
      this._flags.set(pFlag, pValue);
    }
  }
} // Source

export class Contract {
  private _origin: string = '';
  public setOrigin = (pOriginIn: string = 'Default'): void => {
    if (pOriginIn.length === 0) pOriginIn = 'Default';
    this._origin = pOriginIn;
  }
  public getOrigin = (): string => {
    return this._origin;
  }
}

/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
class clientInfo {
  public ID: string = '';
  public validOrigins: string[];
  // public contracts = new Map<string, Contract>();
}
/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/



/*---------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------*/
export class Message {
  /*---------------------------------------------------------------------------------*/
  /*---------------------------------------------------------------------------------*/
  private _source: Source = new Source();
  private _destination: string; // TagSet|undefined;
  public tags = new TagSet();
  private _startTS: Date;
  private _endTS: Date;
  // private _action: eAction;
  private _payloadType: ePayloadType = ePayloadType.text;
  private _payload: any;
  private _Uqri: string = '';
  private _currMsg: string;
  private _templateIdx: number = 0; // See Constructor for default
  private _sections: string[];
  private _contract: Contract;
  private _clientInfo: clientInfo;

  // ###############################
  // ## Generic Message structure ##
  static readonly templates: string[] = [];
  // static readonly config = new Map<string,object>();
  static readonly clients = new Map<string, clientInfo>();
  static readonly existingContracts = new Map<string, Contract>();
  // ###############################

  // Class CONSTRUCTOR
  public static _classConstructor() {
    // 0 = 8 sections
    Message.templates.push('<Source><StartTS><EndTS><Tags><Uqri><PType><Destination><Payload>');
    // 1 = 7 sections
    Message.templates.push('<Source><StartTS><EndTS><Tags><Uqri><PType><Payload>');
    // 2 = 6 sections
    Message.templates.push('<Source><StartTS><EndTS><Tags><PType><Payload>');
    // 3 = 5 sections
    Message.templates.push('<Source><StartTS><Tags><PType><Payload>');
    // 4 = 4 sections
    Message.templates.push('<Source><StartTS><Tags><Payload>');
    // 5 = 3 sections + Source
    Message.templates.push('<Source><StartTS><Payload>');
    // 6 = 3 sections + Tags
    Message.templates.push('<StartTS><Tags><Payload>');    
    // 7 = 2 sections
    Message.templates.push('<Tags><Payload>');
  }

  // CONSTRUCTOR
  constructor() {
    this._currMsg = '';
    // this._source = new TagSet();
    // Set startup default format
    this.setTemplate(0);
    // Create a contracts list for this ContractHolder (if none already exists)
    let pClient = '';
    if (pClient !== '') {
      this._clientInfo = Message.clients.get(pClient);
      if (!this._clientInfo) {
        // Validate client
        let bFound = false;
        this._clientInfo = new clientInfo();
        this._clientInfo.ID = pClient;
        config.validClients.forEach(LvClient => {
          if (LvClient.client === pClient) {
            bFound = true;
            this._clientInfo.validOrigins = LvClient.origins;
            return;
          }
        });
        if (!bFound) {
          throw new Error(`Client: "${pClient}" has not been authorized`);
        }
        //this._contract = new Contract();
        //this._contract.setOrigin('self');
        //this._clientInfo.contracts.set(this._contract.getOrigin(),this._contract)
        Message.clients.set(pClient, this._clientInfo);
      } else {
      }
      if (!this._clientInfo) throw new Error('Could not determine client configuration');
    }
    //this.setOrigin(this._contract.getOrigin());
  } // End of Constructor

  // Parse text message into instance
  public parseText = (pTxtIn: string): void => {
    let ltWrkSects: string[] = [];
    // Make sure section mapping has been done
    this.buildSections();
    // split at group separator
    const ltRecs = pTxtIn.split(eMsgSeparators.grpSep);
    // ??????????????????????????????????????????????????????????????????????????
    // NOTE: For the moment, we are assuming all messages have the 8 fields format
    // ??????????????????????????????????????????????????????????????????????????
    if (this._sections.length === 1) {
      // throw new Error('Parsing error - message sections not defined.');
      const ltTempSects = Message.templates[ltRecs.length].split('><');
      ltTempSects.forEach(elem => {
        ltWrkSects.push(elem.replace("<", "").replace(">", ""));
      });
    } else {
      ltWrkSects = this._sections;
    }
    if (ltRecs.length != ltWrkSects.length) {
      throw new Error('Parsing error - message contains different number of sections to template');
    }
    // Get defaults for this message from current Contract
    // const lvContOrigin = this._contract.getOrigin();
    // this.setOrigin(lvContOrigin);
    // Get new message details
    for (let k = 0; k < ltRecs.length; k++) {
      let ltAtoms = ltRecs[k].split(eMsgSeparators.tagSep);
      const lvSectID = ltWrkSects[k];
      switch (lvSectID) {
        case 'Source':
          ltAtoms.forEach(elem => {
            let ltAtomals = elem.split(eMsgSeparators.tagExtAttSep);
            if (ltAtomals.length === 2) {
              // Tags
              switch (ltAtomals[0]) {
                case 'Origin':
                  // if (lvContOrigin!=='' && ltAtomals[1] !== lvContOrigin){
                  //   throw new Error("Message Origin does not match Contract Origin");
                  // }
                  // if (lvContOrigin===''){
                  this.setOrigin(ltAtomals[1]);
                  // }
                  break;
              }
            } else if (ltAtomals.length === 1) {
              // Flags
              const lvFlag = ltAtomals[0].toLowerCase().replace(/_/g, '');
              switch (lvFlag) {
                case 'query':
                  if (!this.isQuery(true)) {
                    console.error('Query message not allowed (yet)');
                  }
                  break;
                case 'find':
                  if (!this.isFind(true)) {
                    console.error('Find message not allowed (yet)');
                  }
                  break;
                case 'get':
                  if (!this.isGet(true)) {
                    console.error('Get message not allowed (yet)');
                  }
                  break;
                case 'push':
                  if (!this.isPush(true)) {
                    console.error('Push message not allowed (yet)');
                  }
                  break;
                default:
                  this.getSource().setFlag(lvFlag, true);
                  break;
              }
            }
          });
          break;
        case 'StartTS':
          this.setStartTS(new Date(Date.parse(<string>ltAtoms[0])));
          break;
        case 'EndTS':
          this.setEndTS(new Date(Date.parse(<string>ltAtoms[0])));
          break;
        case 'Destination':
          this.setDestination(<string>ltAtoms[0]);
          break;
        case 'Tags':
          const lvTagAttribs = { "name": null, "extension": { "id": null, "value": null } };
          ltAtoms.forEach(lvAtom => {
            let lvArr = lvAtom.split(eMsgSeparators.tagExtStart);
            if (lvArr.length >= 1) {
              lvTagAttribs.name = lvArr[0];
            }
            if (lvArr.length >= 2) {
              lvArr = lvArr[1].split(eMsgSeparators.tagExtEnd);
              if (lvArr.length >= 1) {
                lvTagAttribs.extension.id = lvArr[0];
                lvTagAttribs.extension.value = lvArr[1];
              }
            }
            const lvTag = new Tag(lvTagAttribs.name, lvTagAttribs.extension.id, lvTagAttribs.extension.value);
            this.tags.setTag(lvTag);
          });
          break;
        case 'Uqri':
          break;
        case 'PType':
          // this.setP(ltAtoms[0]);
          break;
        case 'Destination':
          break;
        case 'Payload':
          this.setPayload(ltAtoms[0]);
          break;
      }
    }
    // Validate this message
    let lvOrigin = this.getSource().getOrigin();
    // if (lvOrigin !== '' && this._clientInfo) {
    if (lvOrigin !== '') {
      this._contract = Message.existingContracts.get(lvOrigin);
      if (!this._contract) {
        // Validate if this contract may be accepted
        // let lvClientInfo = Message.clients.get(lvOrigin);
        // if (lvClientInfo.validOrigins.indexOf(lvOrigin) < 0) {
        // throw new Error(`Origin: "${lvOrigin}" is not authorized for client: "${this._clientInfo.ID}"`);
        // }
        this._contract = new Contract();
        this._contract.setOrigin(lvOrigin);
        // this._clientInfo.contracts.set(lvOrigin, this._contract);
        Message.existingContracts.set(lvOrigin, this._contract);
      } else {
      }
    }
  }

  //********************  Setters/Getters *******************/

  //********************  METHODS *******************/
  public setOrigin = (pOrigin: any): void => {
    // if (!this._source) {
    //   this._source = new Source();
    // }
    switch (typeof (pOrigin)) {
      case 'string':
        pOrigin = pOrigin.trim();
        if (pOrigin != 'self' && pOrigin != '' && this._clientInfo && this._clientInfo.validOrigins.indexOf(pOrigin) < 0) {
          throw new Error(`Origin: "${pOrigin}" is not approved for client: "${this._clientInfo.ID}"`);
        }
        this.getSource().setOrigin(pOrigin);
        break;
      case 'object':
        throw new Error("Message.setOrigin: Incomplete functionality - cannot handle Object Origins");
        break;
    } // pSource Switch
  } // setSource

  public getSource = (): Source => {
    return this._source;
  } // getSource
  public setDestination = (pDestination: string): void => {
    this._destination = pDestination;
  } // getDestination
  public getDestination = (): string => {
    return this._destination || '*unknown*';
  } // getDestination

  public setStartTS(tsIn: Date) {
    this._startTS = tsIn;
  } // setStartTS
  public getStartTS(): Date {
    return this._startTS;
  } // getStartTS

  public setEndTS(tsIn: Date) {
    this._endTS = tsIn;
  } // setEndTS
  public getEndTS(): Date {
    return this._endTS;
  } // getEndTS

  // public setAction(actIn: eAction) {
  //   this._action = actIn;
  // } // setAction

  // public getAction = () : eAction => {
  //   return this._action;
  // } // getAction

  public getPayloadType = (): ePayloadType => {
    return this._payloadType;
  } // getPayloadType

  //----------------------------------------------------------------------------
  // IS FIND
  public isFind = (pValue?: boolean): boolean => {
    const lvCurrVal = this._source.getFlags()['Find'];
    if (pValue === null || typeof (pValue) === 'undefined') {
      // Evaluate
      if (lvCurrVal === true) {
        return true;
      } else {
        return false;
      }
    } else {
      // Compare
      if (lvCurrVal === pValue) {
        return true; // if the value requested matches the current value, result = true
      } else {
        if (pValue === false) {
          this._source.setFlag('Find', false);
        } else {
          if (this.isQuery() || this.isGet()) {
            return false;
          } else {
            this._source.setFlag('Find', true);
          }
        }
      };
    }
    return true;
  }

  //----------------------------------------------------------------------------
  // Is GET
  public isGet = (pValue?: boolean): boolean => {
    const lvCurrVal = this._source.getFlags()['Find'];
    if (pValue === null || typeof (pValue) === 'undefined') {
      // Evaluate
      if (lvCurrVal === true) {
        return true;
      } else {
        return false;
      }
    } else {
      // Compare
      if (lvCurrVal === pValue) {
        return true; // if the value requested matches the current value, result = true
      } else {
        if (pValue === false) {
          this._source.setFlag('Find', false);
        } else {
          if (this.isFind() || this.isQuery()) {
            return false;
          } else {
            this._source.setFlag('Find', true);
          }
        }
      };
    }
    return true;
  }

  //----------------------------------------------------------------------------
  // Is Query
  public isQuery = (pValue?: boolean): boolean => {
    // if (!this._source) this._source = new Source();
    const lvCurrVal = this._source.getFlags()['Query'];
    if (pValue === null || typeof (pValue) === 'undefined') {
      // Evaluate
      if (lvCurrVal === true) {
        return true;
      } else {
        return false;
      }
    } else {
      // Compare
      if (lvCurrVal === pValue) {
        return true; // if the value requested matches the current value, result = true
      } else {
        if (pValue === false) {
          this._source.setFlag('Query', false);
        } else {
          if (this.isFind() || this.isGet()) {
            return false;
          } else {
            this._source.setFlag('Query', true);
          }
        }
      };
    }
    return true;
  }

  //----------------------------------------------------------------------------
  // Is Push
  public isPush = (pValue?: boolean): boolean => {
    const lvCurrVal = this._source.getFlags()['Push'];
    if (pValue === null || typeof (pValue) === 'undefined') {
      // Evaluate
      if (lvCurrVal === true) {
        return true;
      } else {
        return false;
      }
    } else {
      // Compare
      if (lvCurrVal === pValue) {
        return true; // if the value requested matches the current value, result = true
      } else {
        if (pValue === false) {
          this._source.setFlag('Push', false);
        } else {
          this._source.setFlag('Push', true);
        }
      };
    }
    return true;
  }

  public setTemplate = (pTemplateIdx: any): void => {
    this._sections = [];
    const lTemplateIdx = parseInt(pTemplateIdx);
    if (lTemplateIdx >= 0 && lTemplateIdx < Message.templates.length)
      this._templateIdx = lTemplateIdx;
    else
      this._templateIdx = Message.templates.length - 1; // Choose last (full)
  } // setTemplate
  public getTemplate = (): number => {
    return this._templateIdx;
  } // getTemplate

  public getPayload = (): Blob | string | ArrayBuffer => {
    return this._payload;
  } // getPayload
  public setPayload = (pPayload: any) => {
    // ^[\[{]
    let lvType: string = typeof (pPayload);
    switch (lvType) {
      case 'string':
        // const lvRegex = new RegExp("^[\[{]","g");
        // if (<string>pPayload.match(lvRegex)){
        try {
          const lvJSONObj = JSON.parse(pPayload.toString());
          lvType = 'JSON'; // ASSUME JSON!
        } catch (es) {
          // Not valid JSON
        }
        // if (/^[\],:{}\s]*$/.test(pPayload.toString().replace(/\\["\\\/bfnrtu]/g, '@').
        //   replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        //   replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        // lvType = 'JSON'; // ASSUME JSON!
        // }
        break;
    }
    switch (lvType) {
      case 'string':
        this._payload = pPayload;
        this._payloadType = ePayloadType.text;
        break;
      case 'JSON':
        this._payload = pPayload;
        this._payloadType = ePayloadType.JSON;
        break;
      case 'object':
        this._payload = JSON.stringify(pPayload);
        this._payloadType = ePayloadType.JSON;
        break;
      default:
        this._payload = pPayload.toString();
        this._payloadType = ePayloadType.text;
    }
  } // setPayload
  public getPayloadObj = (): object => {
    let lvObj = null;
    switch (this._payloadType) {
      case ePayloadType.JSON:
        try {
          lvObj = JSON.parse(this._payload);
        } catch (ex) {
          // Do nothing - return null
        }
        break;
      default:
      // Do nothing - return null
    }
    return lvObj;
  } // getPayloadObj

  //----------------------------------------------------------------------------
  // Build sections
  private buildSections(pRebuild: Boolean = false) {
    // Only build once or if requested
    if (!pRebuild && this._sections.length > 0) return;
    this._sections = [];
    try {
      const ltTempSects = Message.templates[this._templateIdx].split('><');
      ltTempSects.forEach(elem => {
        this._sections.push(elem.replace("<", "").replace(">", ""));
      });
    } catch (ex) {

    }
  } // buildSections

  //----------------------------------------------------------------------------
  // Get Message as a text string
  // public toString = () => { return 'Hello'; }
  // public asText = (pProtocol: Presentation.eProtocol = Presentation.eProtocol.callosal): string => {
  public toString = (): string => {
    // Validate Payload
    let lPLoad = '';
    // if (pProtocol !== Presentation.eProtocol.callosaldub) {
    // CallosalDub does not include the payload with the message header
    switch (this._payloadType) {
      case ePayloadType.JSON:
      case ePayloadType.text:
        lPLoad = '' + this._payload;
        break; // VALID
      case ePayloadType.binary:
        lPLoad = `(Byte Stream of length: ${this._payload.legnth})`;
        break; // VALID
      default:
        // INVALID
        throw new Error('Invalid Payload type for TEXT conversion');
    }
    // }
    // Package sections
    let lSource = this._source ? this._source.toString() : '(null Source)';
    let lTags = this.tags ? this.tags.toString() : '(null Tags)';
    let lPType = '' + this._payloadType;
    let lUqri = '' + this._Uqri;
    let lDest = '' + this._destination;
    let lStartTS = '' + (this._startTS ? this._startTS.toUTCString() : '');
    let lEndTS = '' + (this._endTS ? this._endTS.toUTCString() : '');

    let lSource2 = (lSource !== null && lSource !== '' ? lSource : '');
    let lTags2 = (lTags !== null && lTags !== '' ? lTags : '');
    let lUqri2 = (lUqri !== null ? lUqri : '');
    let lDest2 = (lDest !== null ? lDest : '');
    let lPType2 = (lPType !== null ? lPType : '');
    let lPLoad2 = (lPLoad !== null ? lPLoad : '');
    let lStartTS2 = '';
    if (lStartTS !== null && lStartTS !== '') {
      lStartTS2 = lStartTS;
    }
    let lEndTS2 = '';
    if (lEndTS !== null && lEndTS !== '') {
      lEndTS2 = lEndTS;
    }
    // Start building final message
    let lvTemplateIdx = this._templateIdx;
    if (lvTemplateIdx === 0) lvTemplateIdx = (Message.templates.length - 1);
    this._currMsg = Message.templates[lvTemplateIdx];
    if (this._currMsg == null || (this._currMsg && this._currMsg.length === 0)) {
      throw new Error('Message Template [1-8] has not been set');
    }
    this._currMsg = this._currMsg.replace(/></g, '>' + eMsgSeparators.grpSep + '<');
    this.setSection('Source', lSource2);
    this.setSection('StartTS', lStartTS2);
    this.setSection('EndTS', lEndTS2);
    this.setSection('Tags', lTags2);
    this.setSection('PType', lPType2);
    this.setSection('Uqri', lUqri2);
    this.setSection('Destination', lDest2);
    this.setSection('Payload', lPLoad2);
    // Result
    return this._currMsg;
  } // asText

  // Add Section to message
  private setSection(pSectName: string, lrecIn: string): void {
    let lMsg = '';
    if (lrecIn !== '') {
      lMsg = lrecIn;
    }
    this._currMsg = this._currMsg.replace('<' + pSectName + '>', lMsg);
  }

} // Message
// Static Class Constructor trigger
Message._classConstructor();